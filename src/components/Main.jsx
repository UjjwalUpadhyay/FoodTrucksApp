import React from 'react'
import ReactDOM from 'react-dom';
import Map from './Map'
import Data from './Data'

class Main extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      trucks: [],
      filteredTrucks: [],
      types: [],
      filters: {
        searchTerm: '',
        bounds: false,
        types: []
      },
      usingLocalData: false
    }
  }

  requestData() {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://data.sfgov.org/resource/6a9r-agq8.json', true);
    request.onload = () => {
      var trucks = []
      if(request.status != 200) {
        var local = new XMLHttpRequest();
        local.open('GET', '/food-trucks.json', true)
        local.onload = () => {
          trucks = JSON.parse(request.responseText)
          this.parseTrucks(trucks, true)
        }
        local.send()
      } else {
        trucks = JSON.parse(request.responseText)
        this.parseTrucks(trucks, false)
      }
    }
    request.send()
  }

  parseTrucks(trucks, usingLocalData) {
    var types = []
    for(let i = 0; i<trucks.length; i++) {
      var type = trucks[i].facilitytype
      if(typeof type !== 'undefined' && types.indexOf(type) == -1) {
        types.push(trucks[i].facilitytype)
      }
    }
    this.setState({
      trucks: trucks,
      filteredTrucks: trucks,
      types: types,
      filters: {
        types: JSON.parse(JSON.stringify(types))
      },
      usingLocalData: usingLocalData
    })
  }

  updateFilter(key, value) {
    var newState = this.state 
    newState.filters[key] = value
    this.setState(newState)
  }

  componentDidMount() {
    this.requestData()
  }

  filterTrucks() {
    var filteredTrucks = []
    var trucks = this.state.trucks
    var searchIndexes = ['applicant', 'address', 'fooditems'] // name, street, serving
    if(typeof this.state.filters.bounds !== 'undefined' && this.state.filters.bounds) {
      var lat = this.state.filters.bounds.lat
      var lng = this.state.filters.bounds.lng
    }
    this.state.trucks.map((truck) => {
      let foundViaSearchTerm = false
      let foundViaMapBounds = false
      let foundViaType = false
      if(this.state.filters.searchTerm.length == 0) {
        foundViaSearchTerm = true
      } else {
        for(var i=0; i<searchIndexes.length; i++) {
          let text = truck[searchIndexes[i]]
          if(text != null && text.toLowerCase().search(this.state.filters.searchTerm.toLowerCase()) !== -1) {
            foundViaSearchTerm = true
          }
        }
      }
      if(typeof lat !== 'undefined' && typeof lng !== 'undefined') {
        if(
          Math.abs(parseFloat(truck.longitude)) < Math.abs(lat.s) &&
          Math.abs(parseFloat(truck.longitude)) > Math.abs(lat.f) &&
          Math.abs(parseFloat(truck.latitude)) < Math.abs(lng.s) &&
          Math.abs(parseFloat(truck.latitude)) > Math.abs(lng.f)
        ) {
          foundViaMapBounds = true
        }
      }
      if(this.state.filters.types.indexOf(truck.facilitytype) > -1) {
        foundViaType = true
      }

      if(foundViaSearchTerm && foundViaMapBounds && foundViaType) {
        filteredTrucks.push(truck)
      }
    })
    return filteredTrucks
  }

  render() {
    var filteredTrucks = this.filterTrucks()
    return (
      <div className="containerFluid">
        <div className="row">
          <div className="col-xs-6">
            <Map
              filteredTrucks={filteredTrucks}
              updateFilter={this.updateFilter.bind(this)}
            />
          </div>
          <div className="col-xs-6">
            <Data
              trucks={this.state.trucks}
              allTrucks={this.state.trucks}
              filteredTrucks={filteredTrucks}
              types={this.state.types}
              filters={this.state.filters}
              usingLocalData={this.state.usingLocalData}
              updateFilter={this.updateFilter.bind(this)}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Main