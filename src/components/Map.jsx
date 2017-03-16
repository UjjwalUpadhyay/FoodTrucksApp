import React from 'react'
import ReactDOM from 'react-dom';
import Marker from './Marker'

export default class Map extends React.Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.map = new google.maps.Map(this.refs.map, {
      center: {lng: -122.419771, lat: 37.778464},
      zoom: 13
    })
    google.maps.event.addListener(this.map, 'idle', function(){
      this.parseBoundsUpdatefilter(this.map.getBounds())
    }.bind(this))
    google.maps.event.addListener(this.map, 'dragend', function() {
      this.parseBoundsUpdatefilter(this.map.getBounds())
    }.bind(this))
  }

  parseBoundsUpdatefilter(mapBounds) {
    let bounds = {
      lat: {s: mapBounds.b.b, f: mapBounds.b.f },
      lng: {s: mapBounds.f.b, f: mapBounds.f.f }
    }
    this.props.updateFilter('bounds', bounds)
  }

  render() {
    return (
      <div className="map" ref="map">
        {this.props.filteredTrucks.map((truck) => {
          return <Marker map={this.map} truck={truck} key={truck.objectid} />
        })}
      </div>
    )
  }
}