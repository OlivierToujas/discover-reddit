from flask import Flask, request, jsonify
from flask_cors import CORS
import spotipy
import discover_reddit 
import pymongo, pymongo_args


application = Flask(__name__)
CORS(application)

# Connect to mongodb database
client = pymongo.MongoClient(pymongo_args.MONGODB_SERVER_STRING)
db = client['discover_reddit']

def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@application.route('/', methods=['GET'])
def index():
    return 'Discover Reddit Server.'

# @application.route('/shutdown', methods=['GET'])
# def shutdown():
#     shutdown_server()
#     return 'Shutting down server..'

@application.route('/check', methods=['GET'])
def check():
    return 'Server is running...'

@application.route('/get-data', methods=['POST'])
def get_user_data():
    data = request.json
    token = data['token']
    sp = spotipy.Spotify(token)
    try:
        update_query = {"user_id": sp.current_user()["id"]}
    except Exception as e:
        print(str(e))
        return jsonify({'error': 'token-expired'})

    # Check for user entry in database
    db_col = db.users
    result = db_col.find_one(update_query)
    if result is None:
        return jsonify({'in_db': False})
    else:
        return jsonify({
            'playlist_url': result['playlist_url'],
            'submissions': result['submissions']
        }) 

@application.route('/trigger-playlist', methods=['POST'])
def trigger_playlist():
    data = request.json
    token = data['token']
    sp = spotipy.Spotify(token)
    time = data['time']
    subreddits = data['subreddit_list']
    edm_count = subreddits['edm']
    hhh_count = subreddits['hhh']
    music_count = subreddits['music']
    ltt_count = subreddits['ltt']
    result = None

    try:
        update_query = {"user_id": sp.current_user()["id"]}
    except Exception as e:
        return jsonify({'error': 'token-expired'})
    
    
    try:
        result = discover_reddit.discover_reddit(edm_count=edm_count, hhh_count=hhh_count, music_count=music_count, ltt_count=ltt_count, time_span=time, sub_list=subreddits, sp=sp)
        ret_val = jsonify(result)
        db_col = db.users
        find_entry = db_col.find_one(update_query)

        # Update user entry in database
        if find_entry is None:
            db_col.insert_one(result)
        else:
            db_col.replace_one(update_query, result)

        return ret_val
    except Exception as e:
        print(str(e))
        result = {'message': "trigger-playlist-failure", 'error': str(e)}
        return jsonify(result)

    

def start_server():
    application.run()

# Runs main (should stay at bottom)
if __name__ == '__main__':
    start_server()