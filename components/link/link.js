import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './link.css';

/**
 * @name Link
 * @category Components
 * @constructor
 * @description Displays a link.
 * @extends {ReactComponent}
 * @example-file ./link.examples.html
 */

export function linkHOC(ComposedComponent) {
  const isTag = typeof ComposedComponent === 'string';

  return class Link extends Component {
    static propTypes = {
      className: PropTypes.string,
      active: PropTypes.bool,
      inherit: PropTypes.bool,
      pseudo: PropTypes.bool,
      hover: PropTypes.bool
    }

    render() {
      const {active, inherit, pseudo, hover, className, ...props} = this.props;
      const classes = classNames(styles.link, className, {
        [styles.active]: active,
        [styles.inherit]: inherit,
        [styles.pseudo]: pseudo,
        [styles.hover]: hover
      });

      if (!isTag && !props.activeClassName) {
        props.activeClassName = styles.active;
      }

      return (
        <ComposedComponent
          {...props}
          className={classes}
        />
      );
    }
  };
}

export default linkHOC('a');
