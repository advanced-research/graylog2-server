import PropTypes from 'prop-types';
import React from 'react';
import naturalSort from 'javascript-natural-sort';
import { cloneDeep } from 'lodash';

import { Row, Col, Panel, HelpBlock } from 'components/graylog';
import { Input } from 'components/bootstrap';
import { ExpandableList, ExpandableListItem, SearchForm, Icon } from 'components/common';
import FormsUtils from 'util/FormsUtils';
import Entity from 'logic/content-packs/Entity';

import style from './ContentPackSelection.css';

class ContentPackSelection extends React.Component {
  static _toDisplayTitle(title) {
    const newTitle = title.split('_').join(' ');
    return newTitle[0].toUpperCase() + newTitle.substr(1);
  }

  static propTypes = {
    contentPack: PropTypes.object.isRequired,
    onStateChange: PropTypes.func,
    entities: PropTypes.object,
    selectedEntities: PropTypes.object,
    edit: PropTypes.bool,
  };

  static defaultProps = {
    edit: false,
    onStateChange: () => {},
    entities: {},
    selectedEntities: {},
  };

  constructor(props) {
    super(props);

    this._bindValue = this._bindValue.bind(this);
    this.state = {
      contentPack: props.contentPack,
      filteredEntities: props.entities,
      filter: '',
      isFiltered: false,
      errors: {},
    };
  }

  componentWillReceiveProps(nextProps) {
    const { isFiltered, filter } = this.state;

    this.setState({
      filteredEntities: nextProps.entities,
      contentPack: nextProps.contentPack,
    });

    if (isFiltered) {
      this._filterEntities(filter);
    }
  }

  _validate = (newSelection) => {
    const mandatoryFields = ['name', 'summary', 'vendor'];
    const { contentPack } = this.state;
    const { selectedEntities: propsSelectedEntities } = this.props;
    const selectedEntities = newSelection || propsSelectedEntities;

    const errors = mandatoryFields.reduce((acc, field) => {
      const newErrors = acc;
      if (!contentPack[field] || contentPack[field].length <= 0) {
        newErrors[field] = 'Must be filled out.';
      }
      return newErrors;
    }, {});

    const selectionEmpty = Object.keys(selectedEntities)
      .reduce((acc, entityGroup) => { return acc + selectedEntities[entityGroup].length; }, 0) <= 0;

    if (selectionEmpty) {
      errors.selection = 'Select at least one entity.';
    }

    this.setState({ errors });
  };

  _updateSelectionEntity = (entity) => {
    const { onStateChange, selectedEntities } = this.props;
    const typeName = entity.type.name;
    const newSelection = cloneDeep(selectedEntities);
    newSelection[typeName] = (newSelection[typeName] || []);
    const index = newSelection[typeName].findIndex((e) => { return e.id === entity.id; });
    if (index < 0) {
      newSelection[typeName].push(entity);
    } else {
      newSelection[typeName].splice(index, 1);
    }
    this._validate(newSelection);
    onStateChange({ selectedEntities: newSelection });
  };

  _updateSelectionGroup = (type) => {
    const { entities, onStateChange, selectedEntities } = this.props;
    const newSelection = cloneDeep(selectedEntities);
    if (this._isGroupSelected(type)) {
      newSelection[type] = [];
    } else {
      newSelection[type] = entities[type];
    }

    this._validate(newSelection);
    onStateChange({ selectedEntities: newSelection });
  };

  _onSetFilter = (filter) => {
    this._filterEntities(filter);
  };

  _onClearFilter = () => {
    this._filterEntities('');
  };

  _filterEntities = (filterArg) => {
    const { entities } = this.props;
    const filter = filterArg;

    if (filter.length <= 0) {
      this.setState({ filteredEntities: cloneDeep(entities), isFiltered: false, filter: filter });
      return;
    }
    const filtered = Object.keys(entities).reduce((result, type) => {
      const filteredEntities = cloneDeep(result);
      filteredEntities[type] = entities[type].filter((entity) => {
        const regexp = RegExp(filter, 'i');
        return regexp.test(entity.title);
      });
      return filteredEntities;
    }, {});
    this.setState({ filteredEntities: filtered, isFiltered: true, filter: filter });
  };

  _entityItemHeader = (entity) => {
    if (entity instanceof Entity) {
      return <span><Icon name="archive" className={style.contentPackEntity} />{' '}<span>{entity.title}</span></span>;
    }
    return <span><Icon name="server" />{' '}<span>{entity.title}</span></span>;
  };

  _isSelected(entity) {
    const { selectedEntities } = this.props;
    const typeName = entity.type.name;

    if (!selectedEntities[typeName]) {
      return false;
    }

    return selectedEntities[typeName].findIndex((e) => { return e.id === entity.id; }) >= 0;
  }

  _isGroupSelected(type) {
    const { entities, selectedEntities } = this.props;

    if (!selectedEntities[type]) {
      return false;
    }
    return selectedEntities[type].length === entities[type].length;
  }

  _bindValue(event) {
    this._updateField(event.target.name, FormsUtils.getValueFromInput(event.target));
  }

  _updateField(name, value) {
    const { contentPack } = this.state;
    const { onStateChange } = this.props;

    const updatedPack = contentPack.toBuilder()[name](value).build();
    onStateChange({ contentPack: updatedPack });
    this.setState({ contentPack: updatedPack }, this._validate);
  }

  render() {
    const { contentPack, errors, filteredEntities, isFiltered } = this.state;
    const { edit } = this.props;
    const entitiesComponent = Object.keys(filteredEntities || {})
      .sort((a, b) => naturalSort(a, b))
      .map((entityType) => {
        const group = filteredEntities[entityType];
        const entities = group.sort((a, b) => naturalSort(a.title, b.title)).map((entity) => {
          const checked = this._isSelected(entity);
          const header = this._entityItemHeader(entity);
          return (
            <ExpandableListItem onChange={() => this._updateSelectionEntity(entity)}
                                key={entity.id}
                                checked={checked}
                                expandable={false}
                                padded={false}
                                header={header} />
          );
        });
        if (group.length <= 0) {
          return null;
        }
        return (
          <ExpandableListItem key={entityType}
                              onChange={() => this._updateSelectionGroup(entityType)}
                              indetermined={this._isUndetermined(entityType)}
                              checked={this._isGroupSelected(entityType)}
                              stayExpanded={isFiltered}
                              expanded={isFiltered}
                              padded={false}
                              header={ContentPackSelection._toDisplayTitle(entityType)}>
            <ExpandableList>
              {entities}
            </ExpandableList>
          </ExpandableListItem>
        );
      });

    return (
      <div>
        <Row>
          <Col smOffset={1} lg={8}>
            <h2>General Information</h2>
            <br />
            <form className="content-selection-form" id="content-selection-form" onSubmit={(e) => { e.preventDefault(); }}>
              <fieldset>
                <Input name="name"
                       id="name"
                       type="text"
                       bsStyle={errors.name ? 'error' : null}
                       maxLength={250}
                       value={contentPack.name}
                       onChange={this._bindValue}
                       label="Name"
                       help={errors.name ? errors.name : 'Required. Give a descriptive name for this content pack.'}
                       required />
                <Input name="summary"
                       id="summary"
                       type="text"
                       bsStyle={errors.summary ? 'error' : null}
                       maxLength={250}
                       value={contentPack.summary}
                       onChange={this._bindValue}
                       label="Summary"
                       help={errors.summary ? errors.summary : 'Required. Give a short summary of the content pack.'}
                       required />
                <Input name="description"
                       id="description"
                       type="textarea"
                       value={contentPack.description}
                       onChange={this._bindValue}
                       rows={6}
                       label="Description"
                       help="Give a long description of the content pack in markdown." />
                <Input name="vendor"
                       id="vendor"
                       type="text"
                       bsStyle={errors.vendor ? 'error' : null}
                       maxLength={250}
                       value={contentPack.vendor}
                       onChange={this._bindValue}
                       label="Vendor"
                       help={errors.vendor ? errors.vendor : 'Required. Who did this content pack and how can they be reached, e.g. Name and email.'}
                       required />
                <Input name="url"
                       id="url"
                       type="text"
                       maxLength={250}
                       value={contentPack.url}
                       onChange={this._bindValue}
                       label="URL"
                       help="Where can I find the content pack. e.g. github url" />
              </fieldset>
            </form>
          </Col>
        </Row>
        <Row>
          <Col smOffset={1} lg={8}>
            <h2>Content Pack selection</h2>
            {edit && (
            <HelpBlock>You can select between installed entities from the server (<Icon name="server" />) or
              entities from the former content pack revision (<Icon name="archive" className={style.contentPackEntity} />).
            </HelpBlock>
            )}
          </Col>
        </Row>
        <Row>
          <Col smOffset={1} lg={8}>
            <SearchForm id="filter-input"
                        onSearch={this._onSetFilter}
                        onReset={this._onClearFilter}
                        searchButtonLabel="Filter" />
          </Col>
        </Row>
        <Row>
          <Col smOffset={1} sm={8} lg={8}>
            {errors.selection && <Panel bsStyle="danger">{errors.selection}</Panel> }
            <ExpandableList>
              {entitiesComponent}
            </ExpandableList>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ContentPackSelection;
