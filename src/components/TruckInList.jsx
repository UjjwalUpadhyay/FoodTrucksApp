import React from 'react'

export default class TruckInList extends React.Component {
  render() {
    return (
      <div className="truck-item">
        <strong>{this.props.truck.applicant}</strong><br/>
        {this.props.truck.address}<br/>
        {this.props.truck.fooditems}
      </div>
    )
  }
}