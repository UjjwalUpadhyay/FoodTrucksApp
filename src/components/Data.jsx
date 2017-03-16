import React from 'react'
import ReactDOM from 'react-dom';
import TruckInList from './TruckInList'
import Type from './Type'

export default class Data extends React.Component {

  constructor(props) {
    super(props)
  }

  handleSearchTermChange(event) {
    this.props.updateFilter('searchTerm', event.target.value)
  }

  updateTypeFilter(type, newValue) {
    let newTypes = this.props.filters.types
    let position = newTypes.indexOf(type)
    if(position > -1) {
      newTypes.splice(position, 1)
    } else {
      newTypes.push(type)
    }
    this.props.updateFilter('types', newTypes)
  }

  didComponentUpdate() {
    this.setState({
      selectedTypes: props.types
    })
  }

  render() {
    return (
      <div className="data">
        <div className="search">
          <input
            type="text"
            placeholder="Search by name, street/food type"
            className="form-control"
            onChange={this.handleSearchTermChange.bind(this)}
          />
        </div>
        <div className="types">
          {this.props.types.map((type) => {
            return (
                <Type
                  type={type}
                  key={type}
                  filters={this.props.filters}
                  updateTypeFilter={this.updateTypeFilter.bind(this)}
                />
              )
          })}
        </div>
        <div className="list">
          {this.props.filteredTrucks.length == 0 &&
            this.props.trucks.length > 0 &&
            <div className="no-trucks">There are no food joints as per your criteria :-(</div>
          }
          {this.props.usingLocalData &&
            <div className="alert alert-warning">
              <p>The data-source could not be reached - we are displaying information accurate as of March 16th 2017</p>
            </div>
          }
          {this.props.filteredTrucks.map((truck) => {
            return <TruckInList truck={truck} key={truck.objectid} />
          })}
        </div>
      </div>
    )
  }
}