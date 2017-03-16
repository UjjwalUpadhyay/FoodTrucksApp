import React from 'react'
import ReactDOM from 'react-dom';
import TruckInList from './TruckInList'

export default class Marker extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      markerInstance: false,
      infoWindowInstance: false
    }
  }

  componentDidMount() {
    var position = {
      lat: parseFloat(this.props.truck.latitude),
      lng: parseFloat(this.props.truck.longitude)
    }
    this.markerInstance = new google.maps.Marker({
      position: position,
      map: this.props.map,
      title: this.props.truck.applicant
    })
    this.infoWindow = new google.maps.InfoWindow({
      maxWidth: 200,
      content: '<h3>' + this.props.truck.applicant + '</h3>' +
               '<p>' + this.props.truck.address + '</p>' + 
               '<p>' + this.props.truck.fooditems + '</p>'
    })
    this.markerInstance.addListener('click', function(){
      this.infoWindow.open(this.props.map, this.markerInstance)
    }.bind(this))
    this.setState({
      markerInstance: this.markerInstance,
      infoWindowInstance: this.infoWindowInstance
    })
  }

  componentWillUnmount() {
    this.state.markerInstance.setMap(null)
  }

  render() {
    return null
  }

}
