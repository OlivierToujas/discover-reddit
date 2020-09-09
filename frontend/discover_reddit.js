'use strict';

const e = React.createElement;
const randomString = 'k3w8d4l8iv7kvdl2z4upv';

function embedReddit(url, title, subreddit) {
  let sub_element = <a href={'https://www.reddit.com/r/' + subreddit + '/'}>{'r/' + subreddit}</a>;
  let title_element = <a href={'https://www.reddit.com/' + url}>{title}</a>;
  let bq_element = <blockquote className="reddit-card" data-card-preview="0">{title_element} from {sub_element}</blockquote>;
  return <li>{bq_element}</li>;
}

function hideMenu() {
  $("#menu-container").css("visibility", "hidden");
  $("#menu-container").css("height", "0");

  $("#show-menu").css("height", "min-content");
  $("#show-menu").css("transition-duration", "1s");
  $("#show-menu").css("visibility", "visible");
}

function showMenu() {
  $("#show-menu").css("visibility", "hidden");
  $("#show-menu").css("transition-duration", "0s");
  $("#show-menu").css("height", "0");

  $("#menu-container").css("height", "min-content");
  $("#menu-container").css("visibility", "visible");
}

class PlaylistComp extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.awaitingResponse) {
      return (
        <div id="loading-container">
          <label id="loading-message">Building Playlist</label>
          <img id="loading-icon" src="loading.gif"></img>
        </div>
      );
    } else if (this.props.loadData){
      return (
        <div id="playlists-container">
          <div id="reddit-container">
            <div id="reddit-label">
              <h2>Reddit Posts</h2>
            </div>
            {this.props.redditHtml}
          </div>
          <div id="spotify-container">
            <div id="spotify-label">
              <h2>Spotify Playlist</h2>
            </div>
            <span style={{display: 'flex', justifyContent: 'center', margin: '4px auto', color: 'white'}}>(If the playlist doesn't update properly, please refresh the page.)</span>
            <iframe id="spotify-playlist" src={this.props.playlistURL} frameBorder="0" allowtransparency="true" allow="encrypted-media" importance="high"></iframe>
          </div>
        </div>
      );
    } else {
      return (
        <div></div>
      );
    }
  }
}

class PlaylistMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playlistURL: "",
      redditHtml: "",
      awaitingResponse: false,
      timeSpan: "",
      edmCount: "",
      hhhCount: "",
      musicCount: "",
      lttCount: "",
    };
  }

  currentTotalCount() {
    let sum = Number(this.state.edmCount) + Number(this.state.hhhCount) + Number(this.state.musicCount) + Number(this.state.lttCount);
    return sum;
  }

  hasData() {
    return (this.state.playlistURL != "");
  }

  componentDidMount() {
    let tempHtmlList = [];
    let tempPlaylistURL = "";
    let self = this;
    
    var postData = {
      "token": this.props.token
    };

    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        try {
          var result = JSON.parse(req.responseText);
          if (result['error'] == null) {
            for (let entry in result) {
              if (entry == 'playlist_url'){
                tempPlaylistURL = result[entry];
              } else if (entry == 'submissions'){
                for (let submission in result[entry]) {
                  let redditElem = embedReddit(result[entry][submission].link, result[entry][submission].title, result[entry][submission].sub_name);
                  tempHtmlList.push(redditElem);
                }
              } 
            }
          } else if (result['error'] == "token-expired"){
            window.location.replace("https://discover-reddit.olivier-toujas.com/");
          }
        } catch (err) {
          console.log(err);
        }

        let redditDiv = "";
    
        if (tempHtmlList != []) {
          redditDiv = <ol id="reddit-posts">{tempHtmlList}</ol>;
        }
    
        self.setState({redditHtml: redditDiv});
        self.setState({playlistURL: tempPlaylistURL});
      }
    }

    req.open("POST", "https://discover-reddit-api.olivier-toujas.com/get-data", true);
    req.setRequestHeader("Content-Type", "application/json");
    try{
      req.send(JSON.stringify(postData));
    } catch(err) {
      console.log(err);
    }
  }

  confirmDelete() {
    let retval = confirm("This will permanently remove all your data from Discover Reddit.");

    if (retval) {
      this.deletePlaylist().bind(this);
      showMenu();
    }
  }

  deletePlaylist() {
    let self = this;
    
    var postData = {
      "token": this.props.token
    };

    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        try {
          var result = JSON.parse(req.responseText);
          if (result['error'] == "token-expired"){
            window.location.replace("https://discover-reddit.olivier-toujas.com/");
          }
        } catch (err) {
          console.log(err);
        }
        self.setState({redditHtml: ""});
        self.setState({playlistURL: ""});
      }
    }

    req.open("POST", "https://discover-reddit-api.olivier-toujas.com/delete-playlist", true);
    req.setRequestHeader("Content-Type", "application/json");
    try{
      req.send(JSON.stringify(postData));
    } catch(err) {
      console.log(err);
    }
  }
  
  triggerNewPlaylist(){
    let tempHtmlList = [];
    let tempPlaylistURL = "";
    let self = this;

    hideMenu()
    this.setState({awaitingResponse: true});

    if (this.currentTotalCount() <= 0) {
      alert("Please select at least 1 submission.");
      this.setState({awaitingResponse: false});
      showMenu()
      return;
    }

    if (this.state.timeSpan == "") {
      alert("Please select a time frame.");
      this.setState({awaitingResponse: false});
      showMenu();
      return;
    }

    this.setState({showMenu: false});
    
    var postData = {
      "token": this.props.token,
      "time": this.state.timeSpan,
      "subreddit_list": {
        "edm": Number(this.state.edmCount),
        "hhh": Number(this.state.hhhCount),
        "music": Number(this.state.musicCount),
        "ltt": Number(this.state.lttCount)
      }
    };

    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        try {
          var result = JSON.parse(req.responseText);
          if (result['error'] == null) {
            for (let entry in result) {
              if (entry == 'playlist_url'){
                tempPlaylistURL = result[entry];
              } else if (entry == 'submissions'){
                for (let submission in result[entry]) {
                  let redditElem = embedReddit(result[entry][submission].link, result[entry][submission].title, result[entry][submission].sub_name);
                  tempHtmlList.push(redditElem);
                }
              } 
            }
          } else if (result['error'] == "token-expired"){
            window.location.replace("https://discover-reddit.olivier-toujas.com/");
          }
    
        } catch (err) {
          console.log(err);
        }

        let redditDiv = "";
    
        if (tempHtmlList != []) {
          redditDiv = <ol id="reddit-posts">{tempHtmlList}</ol>;
        }
    
        self.setState({redditHtml: redditDiv});
        self.setState({playlistURL: tempPlaylistURL});
        self.setState({awaitingResponse: false});
      }
    }

    req.open("POST", "https://discover-reddit-api.olivier-toujas.com/trigger-playlist", true);
    req.setRequestHeader("Content-Type", "application/json");
    try{
      req.send(JSON.stringify(postData));
    } catch(err) {
      console.log(err);
    }
  }

  handleTimeChange = changeEvent => {
    this.setState({timeSpan: changeEvent.target.value});
  }

  handleSubSelect = changeEvent => {
    let val = changeEvent.target.value;
    let tempList = this.state.subredditList;

    if (tempList.includes(val)) {
      let index = tempList.indexOf(val)
      tempList.splice(index, 1);
    } else {
      tempList.push(val);
    }
    this.setState({subredditList: tempList});
  }

  handleSubmissionCount = changeEvent => {
    let val = changeEvent.target.value;
    if (changeEvent.target.id == 'edm-count') {
      if (val >= 0 && val <= 50) {
        this.setState({edmCount: ("0" + val).slice(-2)});
      }
    } else if (changeEvent.target.id == 'hhh-count') {
      if (val >= 0 && val <= 50) {
        this.setState({hhhCount: ("0" + val).slice(-2)});
      }
    } else if (changeEvent.target.id == 'music-count') {
      if (val >= 0 && val <= 50) {
        this.setState({musicCount: ("0" + val).slice(-2)});
      }
    } else if (changeEvent.target.id == 'ltt-count') {
      if (val >= 0 && val <= 50) {
        this.setState({lttCount: ("0" + val).slice(-2)});
      }
    }
  }

  render () {
    let deleteButton = <span></span>
    if (this.hasData()) {
      deleteButton = (
        <button id="delete-button" onClick={this.confirmDelete.bind(this)}>
          Delete Current Playlist
        </button>
      );
    }
    var ele = (
      <div id='top-div'>
        <button id="show-menu" onClick={showMenu}>
          Build a New Playlist
        </button>
        <div id="menu-container">
          <div id="subreddit-options">
            <h4>Get {this.currentTotalCount()} Posts From...</h4>
            <span style={{display: 'flex', justifyContent: 'center',margin: '1px auto', color: 'rgb(0, 0, 0, .5'}}>(max 50 per subreddit)</span>
            <label>
              <input type="number" id="edm-count" className="form-control sub-count " min="0" max="60" value={this.state.edmCount} onChange={this.handleSubmissionCount}/>
              <span>r/EDM</span>
            </label>
            <label>
              <input type="number" id="hhh-count" className="form-control sub-count" min="0" max="60" value={this.state.hhhCount} onChange={this.handleSubmissionCount}/>
              <span>r/HipHopHeads</span>
            </label>
            <label>
              <input type="number" id="music-count" className="form-control sub-count" min="0" max="60" value={this.state.musicCount} onChange={this.handleSubmissionCount}/>
              <span>r/Music</span>
            </label>
            <label>
              <input type="number" id="ltt-count" className="form-control sub-count" min="0" max="60" value={this.state.lttCount} onChange={this.handleSubmissionCount}/>
              <span>r/ListenToThis</span>
            </label>
          </div>
          <div id="time-span-options">
            <h4>In The Last {this.state.timeSpan.charAt(0).toUpperCase() + this.state.timeSpan.slice(1)}</h4>
            <label>
              <input type="radio" name="time-span" value="hour" checked={this.state.timeSpan == "hour"} onChange={this.handleTimeChange}/>
              <span>Hour</span>
            </label>
            <label>
              <input type="radio" name="time-span" value="day" checked={this.state.timeSpan == "day"} onChange={this.handleTimeChange}/>
              <span>Day</span>
            </label>
            <label>
              <input type="radio" name="time-span" value="week" checked={this.state.timeSpan == "week"} onChange={this.handleTimeChange}/>
              <span>Week</span>
            </label>
            <label>
              <input type="radio" name="time-span" value="month" checked={this.state.timeSpan == "month"} onChange={this.handleTimeChange}/>
              <span>Month</span>
            </label>
            <label>
              <input type="radio" name="time-span" value="year" checked={this.state.timeSpan == "year"} onChange={this.handleTimeChange}/>
              <span>Year</span>
            </label>
            <label>
              <input type="radio" name="time-span" value="all" checked={this.state.timeSpan == "all"} onChange={this.handleTimeChange}/>
              <span>All-Time</span>
            </label>
          </div>
          <div id="buttons-container">
            <button onClick={this.triggerNewPlaylist.bind(this)} id='trigger-new-playlist'>Create New Playlist</button>
            <button onClick={hideMenu} id='hide-playlist-menu'>Hide Options</button>
          </div>
          
        </div>
        {deleteButton}
        <PlaylistComp loadData={this.hasData()} awaitingResponse={this.state.awaitingResponse} playlistURL={this.state.playlistURL} redditHtml={this.state.redditHtml}/>
      </div>
    );

    return ele;
  }
}

class DiscoverReddit extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getSpotifyToken();
  }

  getSpotifyToken() {
    let hasToken = false;
    let accessToken = "";

    var tokenParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    if ((tokenParams.get('state') == randomString) && (tokenParams.get('access_token') != null)) {
      hasToken = true;
      accessToken = tokenParams.get('access_token');
    } 

    return {
      isAuth: hasToken,
      token: accessToken,
    };
  }

  render() {
    if (this.state.isAuth) {
      return <PlaylistMenu token={this.state.token}/>;
    } else {
      return (
        <div id='sign-in-container'>
          <a id='sign-in-spotify' href={"https://accounts.spotify.com/authorize?client_id=0807e31abd604475b652272b3521e4a4&response_type=token&redirect_uri=https://discover-reddit.olivier-toujas.com&scope=playlist-modify-public&state=" + randomString}>Sign In to Spotify</a>
        </div>
      );
    }
  }
}

ReactDOM.render(<DiscoverReddit/>, document.getElementById('discover-reddit-container'));