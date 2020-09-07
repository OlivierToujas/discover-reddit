# Import the tools we need
import praw
import spotipy
import requests
import pymongo
import praw_args

def sp_search_for_submission(song, sp):
    result = None
    # If Reddit post is a direct link to Spotify track, add directly to Spotify track ID list
    if 'open.spotify' in song.url and 'track' in song.url:
        result = song.url
    # Else, use Spotify API to search for Spotify track ID
    else:
        try:
            # Clean up artist name for better searching
            artist, track_name = song.title.split(' - ')
            artist = artist.split(' & ')[0].split(', ')[0].split(' x ')[0]
        except Exception as e:
            print(str(e))
            return None
        
        # Clean up track name for better searching
        track_name = track_name.split(' ft ')[0]
        if 'Remix' in track_name or 'remix' in track_name:
            query = track_name.replace(")", "").replace("(", "")
        else:
            query = track_name + ' ' + artist
        # Search for track based on track name and one artist
        sp_result = sp.search(q=query, type='track', limit=1)['tracks']['items']
        # If a result is found, add to Spotify track ID list
        if sp_result:
            sp_track = sp_result[0]
            result = sp_track['uri']
    
    return result
        

def get_songs_from_sub(song_count, time_span, sub, reddit, sp):
    reddit_list = []
    song_list = []
    if sub == 'EDM':
        # Set edm variable to instance of r/EDM subreddit
        edm = reddit.subreddit('EDM')
        # Iterate through top posts of the week and find song posts based on flair
        for submission in edm.top(time_filter=time_span, limit=1000):
            flair = submission.link_flair_text
            # New and Throwback flairs indicate song posts
            if flair == 'New' or flair == 'Throwback':
                # Check if submission was found by Spotify search
                search_result = sp_search_for_submission(submission, sp)
                if (search_result != None):
                    reddit_list.append(submission)
                    song_list.append(search_result)
                
                # Limit to paramter given for songs from r/EDM
                if len(reddit_list) >= song_count:
                    break
    elif sub == 'HHH':
        # Set hhh variable to instance of r/HipHopHeads subreddit
        hhh = reddit.subreddit('HipHopHeads')
        # Iterate through top posts of the week and take posts with Spotify links
        for submission in hhh.top(time_filter=time_span, limit=1000):
            if ('spotify' in submission.url or 'music.apple' in submission.url or 'youtu' in submission.url or '/r/hiphopheads' in submission.url) and '[FRESH' in submission.title:
                # Clean up submission title based on r/HipHopHeads naming policies
                new_title = submission.title.split(']')[1].split('(')[0].strip()
                submission.title = new_title
                
                # Check if submission was found by Spotify search
                search_result = sp_search_for_submission(submission, sp)
                if (search_result != None):
                    reddit_list.append(submission)
                    song_list.append(search_result)
                if (len(reddit_list) >= song_count):
                    break
    elif sub == 'Music':
        # Set music variable to instance of r/Music subreddit
        music = reddit.subreddit('Music')
        # Iterate through top posts of the week and take posts with Spotify links
        for submission in music.top(time_filter=time_span, limit=500):
            if ('spotify' in submission.url or 'music.apple' in submission.url or 'youtu' in submission.url) and \
                ('music streaming' in submission.link_flair_text or 'audio' in submission.link_flair_text):
                # Clean up submission title based on r/Music naming policies
                new_title = submission.title.split('[')[0].strip()
                submission.title = new_title

                # Check if submission was found by Spotify search
                search_result = sp_search_for_submission(submission, sp)
                if (search_result != None):
                    reddit_list.append(submission)
                    song_list.append(search_result)
                if (len(reddit_list) >= song_count):
                    break
    elif sub == 'LTT':
        # Set ltt variable to instance of r/ListenToThis subreddit
        ltt = reddit.subreddit('ListenToThis')
        # Iterate through top posts of the week and take posts with Spotify links
        for submission in ltt.top(time_filter=time_span, limit=500):
            if ('spotify' in submission.url or 'music.apple' in submission.url or 'youtu' in submission.url):
                # Clean up submission title based on r/ListenToThis naming policies
                new_title = submission.title.split('[')[0].strip()
                submission.title = new_title

                # Check if submission was found by Spotify search
                search_result = sp_search_for_submission(submission, sp)
                if (search_result != None):
                    reddit_list.append(submission)
                    song_list.append(search_result)
                if (len(reddit_list) >= song_count):
                    break
    
    return reddit_list, song_list

def discover_reddit(edm_count, hhh_count, music_count, ltt_count, time_span, sub_list, sp):
    # Create a Reddit instance using praw and my Reddit account info.
    # Details on how to do this can be found at the beginning of this article:
    # https://www.storybench.org/how-to-scrape-reddit-with-python/
    reddit = praw.Reddit(client_id=praw_args.REDDIT_CLIENT_ID, client_secret=praw_args.REDDIT_CLIENT_SECRET, \
                        user_agent=praw_args.REDDIT_USER_AGENT, username=praw_args.REDDIT_USERNAME, password=praw_args.REDDIT_PASSWORD)
        
    # Set Spotify track ID list to empty list
    sp_track_id_list = []
    # New variable with data to be returned upon script completion
    reddit_posts_list = []
    
    # For each specified subreddit, get the specified number of songs and add to spotify song list and reddit posts list

    if edm_count > 0:
        returned_rd_list, returned_sp_list = get_songs_from_sub(song_count=edm_count, time_span=time_span, sub="EDM", reddit=reddit, sp=sp)
        reddit_posts_list.extend(returned_rd_list)
        sp_track_id_list.extend(returned_sp_list)

    if hhh_count > 0:
        returned_rd_list, returned_sp_list = get_songs_from_sub(song_count=hhh_count, time_span=time_span, sub="HHH", reddit=reddit, sp=sp)
        reddit_posts_list.extend(returned_rd_list)
        sp_track_id_list.extend(returned_sp_list)
    
    if music_count > 0:
        returned_rd_list, returned_sp_list = get_songs_from_sub(song_count=music_count, time_span=time_span, sub="Music", reddit=reddit, sp=sp)
        reddit_posts_list.extend(returned_rd_list)
        sp_track_id_list.extend(returned_sp_list)
    
    if ltt_count > 0:
        returned_rd_list, returned_sp_list = get_songs_from_sub(song_count=ltt_count, time_span=time_span, sub="LTT", reddit=reddit, sp=sp)
        reddit_posts_list.extend(returned_rd_list)
        sp_track_id_list.extend(returned_sp_list)
        
    # Set playlist exists flag to false
    playlist_exists = False
    # Set playlist ID to None
    sp_playlist_id = None
    # Search through user's playlists to see if Discover Reddit exists
    for playlist in sp.current_user_playlists()['items']:
        # If Discover Reddit does exist, get the playlist ID
        if playlist['name'] == 'Discover Reddit':
            sp_playlist_id = playlist['id']
            # Set playlist exists flag to True
            playlist_exists = True
            break
    

    # Create playlist if it doesn't already exist, keeping new playlist ID
    if not playlist_exists:
        sp_playlist_id = sp.user_playlist_create(user=sp.current_user()['id'], name='Discover Reddit', \
                                                description='Dynamic playlist curated from tracks shared on Reddit.')['id']

    # Replace the tracks in Discover Reddit with new tracks from Spotify track ID list
    sp.user_playlist_replace_tracks(user=sp.current_user()['id'], playlist_id=sp_playlist_id, tracks=sp_track_id_list)

    # Build returned dict with Reddit Submissions, Spotify User ID and Spotify Playlist URL
    returned_dict = {'user_id': sp.current_user()['id']}
    submission_dict = {}
    submission_count = 1

    for submission in reddit_posts_list:
        submission_num = 'submission' + str("{:02d}".format(submission_count))
        submission_count = submission_count + 1
        temp = {
            'link': submission.permalink,
            'id': submission.id,
            'title': submission.title,
            'sub_name': submission.subreddit.display_name
        }
        
        submission_dict[submission_num] = temp

    playlist_url = sp.playlist(sp_playlist_id)['external_urls']['spotify']
    half1, half2 = playlist_url.split('playlist')
    playlist_url = half1 + 'embed/playlist' + half2
    returned_dict['submissions'] = submission_dict
    returned_dict['playlist_url'] = playlist_url

    # Return dict of data gathered by dsicover_reddit.py
    return returned_dict

if __name__ == '__main__':
    print("Called from main")