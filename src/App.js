import React, { Component } from 'react';
import './App.css';
import { debounce, toDeg, toRad, degToCompass } from './utils'
import { pois } from './config';
// import { GyroNorm } from 'gyronorm';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      coords: [],
      heading: '',
      distance: 0,
      orientation: false,
      video: false,
      positionWatcher: undefined
    }
  }

  getPosition() {
    if (navigator.geolocation) {
      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      };
        const positionWatcher = navigator.geolocation.watchPosition(
          this.setCoordinates.bind(this), 
          () => { console.log('error watch position'); }, 
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
        this.setState({
          positionWatch: positionWatcher
        })
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
  }

  handleOrientation(data) {
    const beta = data.do.beta
    console.log(beta)
    const newOrientation = beta > 35 && beta < 120;

    if (this.state.orientation !== newOrientation) {
      this.setState({
        orientation: newOrientation
      })
    }
  }

  getOrientation() {
    var gn = new GyroNorm(); // eslint-disable-line no-undef

    gn.init({
        frequency:200,                   // ( How often the object sends the values - milliseconds )
        decimalCount:2,                 // ( How many digits after the decimal point will there be in the return values )
    }).then(() => {
      gn.start((data) => this.handleOrientation(data));
    }).catch((e) => {
      // Catch if the DeviceOrientation or DeviceMotion is not supported by the browser or device
    });
  }

  componentWillUnmount() {
    if(navigator.geolocation) {
      navigator.geolocation.clearWatch(this.state.positionWatcher);
    }
  }

  componentDidMount() {
    this.getVideo();
    this.getOrientation();
    this.getPosition();
  }

  getVideo() {
    const idealWidth = window.innerWidth > 480 && window.innerWidth < 1024 ? window.innerWidth : 640;
    const idealHeight = window.innerHeight > 360 && window.innerHeight < 720 ? window.innerHeight : 480;
    navigator.mediaDevices.getUserMedia({ video: {
      width: { min: 360, ideal: idealWidth , max: 1024 },
      height: { min: 240, ideal: idealHeight, max: 720 },
    } })
    .then((mediaStream) => {
      var video = document.getElementById('video');
      video.srcObject = mediaStream;

      video.onloadedmetadata = (e) => {
        this.setState({
          video: true
        });
      };
    })
    .catch(function(err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.;
  }

  setCoordinates(position) {
    console.log(position, 'coordinates')
    const coords = this.state.coords;
    if (coords.length === 0 || (coords[0][0] !== position.coords.latitude && coords[0][0] !== position.coords.longitude))
      coords.unshift([position.coords.latitude, position.coords.longitude]);
    if (coords.length > 2) coords.pop();
    this.getCompass(coords)
    this.getDistance(coords[0], pois[0]);
  }

  getCompass(coords) {
    if (coords.length > 1) {
      const [lat1, lng1] = this.state.coords[1];
      const [lat2, lng2] = this.state.coords[0];

      var dLon = (lng2-lng1);
      var y = Math.sin(dLon) * Math.cos(lat2);
      var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
      var brng = toDeg(Math.atan2(y, x));
      var bearing = degToCompass(360 - ((brng + 360) % 360));

      this.setState({
        coords: coords,
        heading: bearing
      });
    } else {
      this.setState({
        coords: coords
      })
    }
  }

  getDistance(coordUser, coordPOI) {
    const [ lat1, lon1 ] = coordUser;
    const lat2 = coordPOI.latitude;
    const lon2 = coordPOI.longitude

    var R = 6371e3; // metres
    var φ1 = toRad(lat1);
    var φ2 = toRad(lat2);
    var Δφ = toRad(lat2-lat1);
    var Δλ = toRad(lon2-lon1);

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;

    this.setState({
      distance: d
    })
  }

  render() {
    const { distance, heading, orientation } = this.state;
    if (distance < 600
      && pois[0].compass.indexOf(heading) !== -1
      && !orientation) {
      const video = document.getElementById('video');
      const rects = document.querySelectorAll('.rect');
      rects.forEach(( node ) => {
          node.parentNode.removeChild( node );
      });

      var rect = document.createElement('div');
      if (document.querySelector('.demo-container')) {
        document.querySelector('.demo-container').appendChild(rect);
        rect.classList.add('rect');
        rect.style.border = '2px solid black';
        rect.style.opacity = 0.65;
        rect.style.backgroundColor = 'white';
        rect.style.width = 150 + 'px';
        rect.style.height = 150 + 'px';
        rect.innerText = 'This is New World Chaffers. It has been invented in 1568 by a French baker. [LINK TO WEBSITE]';
      }
    } else {
      const rects = document.querySelectorAll('.rect');
      rects.forEach(( node ) => {
          node.parentNode.removeChild( node );
      });
    }

    return (
      <div>
        <div className="App demo-container">
          <video id="video" autoPlay></video>
        </div>
        <div>
          {this.state.coords.length > 0 && (
            <div>
              <p>Latitude: {this.state.coords[0][0]}</p>
              <p>Longitude: {this.state.coords[0][1]}</p>
            </div>
          )}
          <p>Heading: {this.state.heading}</p>
          <p>Distance: {this.state.distance}</p>
        </div>
      </div>
    );
  }
}

export default App;

