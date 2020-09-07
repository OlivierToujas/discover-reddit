# Discover Reddit

Discover Reddit is a basic web application that allows Spotify users to build playlists based on tracks shared on various Reddit forums. The user authenticates through Spotify and chooses various options to build the playlist with. Once the playlist is built, the user will be able to see which Reddit posts were gathered and the final Spotify playlist.

## Web App

The web application is currently live and can be accessed at [discover-reddit.olivier-toujas.com](https://discover-reddit.olivier-toujas.com).

## Workflow

The frontend is built using ReactJS and is hosted on an AWS Amplify instance. The backend is a Python Flask server hosted on an AWS ElasticBeanstalk instance, with all required modules defined in ```backend/requirements.txt```. 

### Frontend

Upon initial load, the client attempts to authenticate the user with a Spotify access token. The token is then sent to the server in a POST request to get a user's initial playlist data in JSON format, that is then parsed and displayed by the client. When a client attempts to trigger a new playlist, another POST request is sent to the server containing all playlist parameters.

### Backend

The server uses these parameters to scrape specified subreddits for songs which are then searched on Spotify's platform. If found, the Reddit post and Spotify track are stored as playlist data. Playlist data is then returned to the client in JSON format where it is parsed and displayed to the user.

## Download Code
``` git clone https://github.com/OlivierToujas/discover-reddit/```
