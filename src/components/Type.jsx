import React from 'react'

export default class Type extends React.Component {
  constructor(props) {
    super(props)
  }

  isActiveFilter() {
    var type = this.props.type
    var activeTypes = this.props.filters.types
    return activeTypes.indexOf(type) !== -1
  }

  toggle() {
    this.props.updateTypeFilter(this.props.type, !this.isActiveFilter())
  }

  render() {
    var checked = this.isActiveFilter()
    return (
      <div className="type col-sm-4">
        <div className="checkbox">
          <label htmlFor={"type_" + this.props.type}>
            <input type="checkbox" id={"type_" + this.props.type} checked={checked} onChange={this.toggle.bind(this)} />
            {this.props.type}
          </label>
        </div>
      </div>
    )
  }
}