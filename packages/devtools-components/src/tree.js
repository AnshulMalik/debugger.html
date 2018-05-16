/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";
const { Component, createFactory } = React;
import dom from "react-dom-factories";
import PropTypes from "prop-types";
import { throttle } from "lodash";

require("./tree.css");

// depth
const AUTO_EXPAND_DEPTH = 0;
const NUMBER_OF_EXTRA_ITEMS = 50;

/**
 * An arrow that displays whether its node is expanded (▼) or collapsed
 * (▶). When its node has no children, it is hidden.
 */
class ArrowExpander extends Component {
  static get propTypes() {
    return {
      expanded: PropTypes.bool
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.expanded !== nextProps.expanded;
  }

  render() {
    const { expanded } = this.props;

    const classNames = ["arrow"];
    if (expanded) {
      classNames.push("expanded");
    }
    return dom.img({
      className: classNames.join(" ")
    });
  }
}

const treeIndent = dom.span({ className: "tree-indent" }, "\u200B");

class TreeNode extends Component {
  static get propTypes() {
    return {
      id: PropTypes.any.isRequired,
      index: PropTypes.number.isRequired,
      depth: PropTypes.number.isRequired,
      focused: PropTypes.bool.isRequired,
      expanded: PropTypes.bool.isRequired,
      item: PropTypes.any.isRequired,
      isExpandable: PropTypes.bool.isRequired,
      onClick: PropTypes.func,
      renderItem: PropTypes.func.isRequired
    };
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.item !== nextProps.item ||
      this.props.focused !== nextProps.focused ||
      this.props.expanded !== nextProps.expanded
    );
  }

  render() {
    const {
      depth,
      id,
      item,
      focused,
      expanded,
      renderItem,
      isExpandable
    } = this.props;

    const arrow = isExpandable
      ? ArrowExpanderFactory({
          item,
          expanded
        })
      : null;

    let ariaExpanded;
    if (this.props.isExpandable) {
      ariaExpanded = false;
    }
    if (this.props.expanded) {
      ariaExpanded = true;
    }

    const indents = Array.from({ length: depth }).fill(treeIndent);
    const items = indents.concat(
      renderItem(item, depth, focused, arrow, expanded)
    );

    return dom.div(
      {
        id,
        className: `tree-node${focused ? " focused" : ""}`,
        onClick: this.props.onClick,
        role: "treeitem",
        "aria-level": depth + 1,
        "aria-expanded": ariaExpanded,
        "data-expandable": this.props.isExpandable
      },
      ...items
    );
  }
}

const ArrowExpanderFactory = createFactory(ArrowExpander);
const TreeNodeFactory = createFactory(TreeNode);

/**
 * Create a function that calls the given function `fn` only once per animation
 * frame.
 *
 * @param {Function} fn
 * @returns {Function}
 */
function oncePerAnimationFrame(fn) {
  let animationId = null;
  let argsToPass = null;
  return function(...args) {
    argsToPass = args;
    if (animationId !== null) {
      return;
    }

    animationId = requestAnimationFrame(() => {
      fn.call(this, ...argsToPass);
      animationId = null;
      argsToPass = null;
    });
  };
}

function closestScrolledParent(node) {
  if (node == null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  }
  return closestScrolledParent(node.parentNode);
}

/**
 * A generic tree component. See propTypes for the public API.
 *
 * This tree component doesn't make any assumptions about the structure of your
 * tree data. Whether children are computed on demand, or stored in an array in
 * the parent's `_children` property, it doesn't matter. We only require the
 * implementation of `getChildren`, `getRoots`, `getParent`, and `isExpanded`
 * functions.
 *
 * This tree component is well tested and reliable. See the tests in ./tests
 * and its usage in the performance and memory panels in mozilla-central.
 *
 * This tree component doesn't make any assumptions about how to render items in
 * the tree. You provide a `renderItem` function, and this component will ensure
 * that only those items whose parents are expanded and which are visible in the
 * viewport are rendered. The `renderItem` function could render the items as a
 * "traditional" tree or as rows in a table or anything else. It doesn't
 * restrict you to only one certain kind of tree.
 *
 * The tree comes with basic styling for the indent, the arrow, as well as
 * hovered and focused styles which can be override in CSS.
 *
 * ### Example Usage
 *
 * Suppose we have some tree data where each item has this form:
 *
 *     {
 *       id: Number,
 *       label: String,
 *       parent: Item or null,
 *       children: Array of child items,
 *       expanded: bool,
 *     }
 *
 * Here is how we could render that data with this component:
 *
 *     class MyTree extends Component {
 *       static get propTypes() {
 *         // The root item of the tree, with the form described above.
 *         return {
 *           root: PropTypes.object.isRequired
 *         };
 *       },
 *
 *       render() {
 *         return Tree({
 *           itemHeight: 20, // px
 *
 *           getRoots: () => [this.props.root],
 *
 *           getParent: item => item.parent,
 *           getChildren: item => item.children,
 *           getKey: item => item.id,
 *           isExpanded: item => item.expanded,
 *
 *           renderItem: (item, depth, isFocused, arrow, isExpanded) => {
 *             let className = "my-tree-item";
 *             if (isFocused) {
 *               className += " focused";
 *             }
 *             return dom.div({
 *               className,
 *             },
 *               arrow,
 *               // And here is the label for this item.
 *               dom.span({ className: "my-tree-item-label" }, item.label)
 *             );
 *           },
 *
 *           onExpand: item => dispatchExpandActionToRedux(item),
 *           onCollapse: item => dispatchCollapseActionToRedux(item),
 *         });
 *       }
 *     }
 */
class Tree extends Component {
  static get propTypes() {
    return {
      // Required props

      // A function to get an item's parent, or null if it is a root.
      //
      // Type: getParent(item: Item) -> Maybe<Item>
      //
      // Example:
      //
      //     // The parent of this item is stored in its `parent` property.
      //     getParent: item => item.parent
      getParent: PropTypes.func.isRequired,

      // A function to get an item's children.
      //
      // Type: getChildren(item: Item) -> [Item]
      //
      // Example:
      //
      //     // This item's children are stored in its `children` property.
      //     getChildren: item => item.children
      getChildren: PropTypes.func.isRequired,

      // A function which takes an item and ArrowExpander component instance and
      // returns a component, or text, or anything else that React considers
      // renderable.
      //
      // Type: renderItem(item: Item,
      //                  depth: Number,
      //                  isFocused: Boolean,
      //                  arrow: ReactComponent,
      //                  isExpanded: Boolean) -> ReactRenderable
      //
      // Example:
      //
      //     renderItem: (item, depth, isFocused, arrow, isExpanded) => {
      //       let className = "my-tree-item";
      //       if (isFocused) {
      //         className += " focused";
      //       }
      //       return dom.div(
      //         {
      //           className,
      //           style: { marginLeft: depth * 10 + "px" }
      //         },
      //         arrow,
      //         dom.span({ className: "my-tree-item-label" }, item.label)
      //       );
      //     },
      renderItem: PropTypes.func.isRequired,

      // A function which returns the roots of the tree (forest).
      //
      // Type: getRoots() -> [Item]
      //
      // Example:
      //
      //     // In this case, we only have one top level, root item. You could
      //     // return multiple items if you have many top level items in your
      //     // tree.
      //     getRoots: () => [this.props.rootOfMyTree]
      getRoots: PropTypes.func.isRequired,

      // A function to get a unique key for the given item. This helps speed up
      // React's rendering a *TON*.
      //
      // Type: getKey(item: Item) -> String
      //
      // Example:
      //
      //     getKey: item => `my-tree-item-${item.uniqueId}`
      getKey: PropTypes.func.isRequired,

      // A function to get whether an item is expanded or not. If an item is not
      // expanded, then it must be collapsed.
      //
      // Type: isExpanded(item: Item) -> Boolean
      //
      // Example:
      //
      //     isExpanded: item => item.expanded,
      isExpanded: PropTypes.func.isRequired,

      // Optional props

      // The currently focused item, if any such item exists.
      focused: PropTypes.any,

      // Handle when a new item is focused.
      onFocus: PropTypes.func,

      // The depth to which we should automatically expand new items.
      autoExpandDepth: PropTypes.number,
      // Should auto expand all new items or just the new items under the first
      // root item.
      autoExpandAll: PropTypes.bool,

      // Note: the two properties below are mutually exclusive. Only one of the
      // label properties is necessary.
      // ID of an element whose textual content serves as an accessible label
      // for a tree.
      labelledby: PropTypes.string,
      // Accessibility label for a tree widget.
      label: PropTypes.string,

      // Optional event handlers for when items are expanded or collapsed.
      // Useful for dispatching redux events and updating application state,
      // maybe lazily loading subtrees from a worker, etc.
      //
      // Type:
      //     onExpand(item: Item)
      //     onCollapse(item: Item)
      //
      // Example:
      //
      //     onExpand: item => dispatchExpandActionToRedux(item)
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func,
      // Optional event handler called with the current focused node when the
      // Enter key is pressed. Can be useful to allow further keyboard actions
      // within the tree node.
      onActivate: PropTypes.func,
      isExpandable: PropTypes.func,
      // Additional classes to add to the root element.
      className: PropTypes.string,
      // style object to be applied to the root element.
      style: PropTypes.object
    };
  }

  static get defaultProps() {
    return {
      autoExpandDepth: AUTO_EXPAND_DEPTH,
      autoExpandAll: true
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      seen: new Set(),
      traversal: [],
      visibleTraversal: [],
      topSpace: 0,
      bottomSpace: 0
    };

    this._onExpand = this._onExpand.bind(this);
    this._onCollapse = this._onCollapse.bind(this);
    this._focusPrevNode = oncePerAnimationFrame(this._focusPrevNode).bind(this);
    this._focusNextNode = oncePerAnimationFrame(this._focusNextNode).bind(this);
    this._focusParentNode = oncePerAnimationFrame(this._focusParentNode).bind(
      this
    );
    this._focusFirstNode = oncePerAnimationFrame(this._focusFirstNode).bind(
      this
    );
    this._focusLastNode = oncePerAnimationFrame(this._focusLastNode).bind(this);

    this._autoExpand = this._autoExpand.bind(this);
    this._preventArrowKeyScrolling = this._preventArrowKeyScrolling.bind(this);
    this._dfs = this._dfs.bind(this);
    this._dfsFromRoots = this._dfsFromRoots.bind(this);
    this._focus = this._focus.bind(this);
    this._scrollNodeIntoView = this._scrollNodeIntoView.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._nodeIsExpandable = this._nodeIsExpandable.bind(this);
    this._activateNode = oncePerAnimationFrame(this._activateNode).bind(this);
    this._onScroll = throttle(this._onScroll.bind(this), 50);
  }

  componentDidMount() {
    this._autoExpand();
    if (this.props.focused) {
      this._scrollNodeIntoView(this.props.focused);
      // Always keep the focus on the tree itself.
      this.treeRef.focus();
    }
  }

  _onScroll(e) {
    const { scrollTop } = this.parent;

    this.setState({ scrollTop });
    this.updateTraversal();
  }

  updateTraversal(traversal) {
    if (!traversal) {
      traversal = this.state.traversal;
    }

    const { topSpace, bottomSpace, start, end } = this.calculateSpace(
      traversal
    );
    const visibleTraversal = traversal.slice(start, end + 1);

    this.setState({ topSpace, bottomSpace, visibleTraversal });
  }

  componentWillReceiveProps(nextProps) {
    this._autoExpand();

    const traversal = this._dfsFromRoots(nextProps);

    this.setState({ traversal });
    this.updateTraversal(traversal);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.focused && prevProps.focused !== this.props.focused) {
      this._scrollNodeIntoView(this.props.focused);
      // Always keep the focus on the tree itself.
      this.treeRef.focus();
    }

    const parent = closestScrolledParent(this.treeRef);
    if (parent && parent != this.parent) {
      this.parent = parent;
      parent.addEventListener("scroll", this._onScroll);
    }
  }

  _autoExpand() {
    if (!this.props.autoExpandDepth) {
      return;
    }

    // Automatically expand the first autoExpandDepth levels for new items. Do
    // not use the usual DFS infrastructure because we don't want to ignore
    // collapsed nodes.
    const autoExpand = (item, currentDepth) => {
      if (
        currentDepth >= this.props.autoExpandDepth ||
        this.state.seen.has(item)
      ) {
        return;
      }

      this.props.onExpand(item);
      this.state.seen.add(item);

      const children = this.props.getChildren(item);
      const length = children.length;
      for (let i = 0; i < length; i++) {
        autoExpand(children[i], currentDepth + 1);
      }
    };

    const roots = this.props.getRoots();
    const length = roots.length;
    if (this.props.autoExpandAll) {
      for (let i = 0; i < length; i++) {
        autoExpand(roots[i], 0);
      }
    } else if (length != 0) {
      autoExpand(roots[0], 0);
    }
  }

  _preventArrowKeyScrolling(e) {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent) {
          if (e.nativeEvent.preventDefault) {
            e.nativeEvent.preventDefault();
          }
          if (e.nativeEvent.stopPropagation) {
            e.nativeEvent.stopPropagation();
          }
        }
    }
  }

  /**
   * Perform a pre-order depth-first search from item.
   */
  _dfs(item, maxDepth = Infinity, traversal = [], _depth = 0, newProps = null) {
    const props = newProps ? newProps : this.props;

    traversal.push({ item, depth: _depth });

    if (!props.isExpanded(item)) {
      return traversal;
    }

    const nextDepth = _depth + 1;

    if (nextDepth > maxDepth) {
      return traversal;
    }

    const children = props.getChildren(item);
    const length = children.length;
    for (let i = 0; i < length; i++) {
      this._dfs(children[i], maxDepth, traversal, nextDepth, props);
    }

    return traversal;
  }

  /**
   * Perform a pre-order depth-first search over the whole forest.
   */
  _dfsFromRoots(props, maxDepth = Infinity) {
    const traversal = [];
    const roots = props.getRoots();
    const length = roots.length;

    for (let i = 0; i < length; i++) {
      this._dfs(roots[i], maxDepth, traversal, 0, props);
    }

    return traversal;
  }

  /**
   * Expands current row.
   *
   * @param {Object} item
   * @param {Boolean} expandAllChildren
   */
  _onExpand(item, expandAllChildren) {
    if (this.props.onExpand) {
      this.props.onExpand(item);

      if (expandAllChildren) {
        const children = this._dfs(item);
        const length = children.length;
        for (let i = 0; i < length; i++) {
          this.props.onExpand(children[i].item);
        }
      }
    }
  }

  /**
   * Collapses current row.
   *
   * @param {Object} item
   */
  _onCollapse(item) {
    if (this.props.onCollapse) {
      this.props.onCollapse(item);
    }
  }

  /**
   * Sets the passed in item to be the focused item.
   *
   * @param {Object|undefined} item
   *        The item to be focused, or undefined to focus no item.
   *
   * @param {Object|undefined} options
   *        An options object which can contain:
   *          - dir: "up" or "down" to indicate if we should scroll the element
   *                 to the top or the bottom of the scrollable container when
   *                 the element is off canvas.
   */
  _focus(item, options = {}) {
    const { preventAutoScroll } = options;
    if (item && !preventAutoScroll) {
      this._scrollNodeIntoView(item, options);
    }
    if (this.props.onFocus) {
      this.props.onFocus(item);
    }
  }

  /**
   * Sets the passed in item to be the focused item.
   *
   * @param {Object|undefined} item
   *        The item to be scrolled to.
   *
   * @param {Object|undefined} options
   *        An options object which can contain:
   *          - dir: "up" or "down" to indicate if we should scroll the element
   *                 to the top or the bottom of the scrollable container when
   *                 the element is off canvas.
   */
  _scrollNodeIntoView(item, options = {}) {
    if (item !== undefined) {
      const element = document.getElementById(this.props.getKey(item));

      if (element) {
        const { top, bottom } = element.getBoundingClientRect();
        const scrolledParent = this.parent;
        const scrolledParentRect = scrolledParent
          ? scrolledParent.getBoundingClientRect()
          : null;
        const isVisible =
          !scrolledParent ||
          (top >= scrolledParentRect.top &&
            bottom <= scrolledParentRect.bottom);

        if (!isVisible) {
          const { alignTo } = options;
          const scrollToTop = alignTo
            ? alignTo === "top"
            : !scrolledParentRect || top < scrolledParentRect.top;
          element.scrollIntoView(scrollToTop);
        }
      } else if (this.parent) {
        const { traversal } = this.state;
        const { itemHeight } = this.props;
        const items = traversal.map(a => a.item);
        const index = items.indexOf(item);

        const { clientHeight } = this.parent;
        const itemsInViewPort = Math.floor(clientHeight / itemHeight);

        let start = index - Math.floor(itemsInViewPort / 2);
        let end = index + Math.floor(itemsInViewPort / 2);

        if (start < 0) {
          start = 0;
        } else if (end >= traversal.length) {
          end = traversal.length - 1;
        }

        const { topSpace } = this.calculateSpaces(start, end);
        this.parent.scrollTop = topSpace;
        this.setState({ scrollTop: topSpace });
      }
    }
  }

  /**
   * Sets the state to have no focused item.
   */
  _onBlur() {
    this._focus(undefined);
  }

  /**
   * Handles key down events in the tree's container.
   *
   * @param {Event} e
   */
  _onKeyDown(e) {
    if (this.props.focused == null) {
      return;
    }

    // Allow parent nodes to use navigation arrows with modifiers.
    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }

    this._preventArrowKeyScrolling(e);

    switch (e.key) {
      case "ArrowUp":
        this._focusPrevNode();
        return;

      case "ArrowDown":
        this._focusNextNode();
        return;

      case "ArrowLeft":
        if (
          this.props.isExpanded(this.props.focused) &&
          this._nodeIsExpandable(this.props.focused)
        ) {
          this._onCollapse(this.props.focused);
        } else {
          this._focusParentNode();
        }
        return;

      case "ArrowRight":
        if (
          this._nodeIsExpandable(this.props.focused) &&
          !this.props.isExpanded(this.props.focused)
        ) {
          this._onExpand(this.props.focused);
        } else {
          this._focusNextNode();
        }
        return;

      case "Home":
        this._focusFirstNode();
        return;

      case "End":
        this._focusLastNode();
        return;

      case "Enter":
        this._activateNode();
    }
  }

  /**
   * Sets the previous node relative to the currently focused item, to focused.
   */
  _focusPrevNode() {
    // Start a depth first search and keep going until we reach the currently
    // focused node. Focus the previous node in the DFS, if it exists. If it
    // doesn't exist, we're at the first node already.

    let prev;
    const { traversal } = this.state;
    const length = traversal.length;
    for (let i = 0; i < length; i++) {
      const item = traversal[i].item;
      if (item === this.props.focused) {
        break;
      }
      prev = item;
    }
    if (prev === undefined) {
      return;
    }

    this._focus(prev, { alignTo: "top" });
  }

  /**
   * Handles the down arrow key which will focus either the next child
   * or sibling row.
   */
  _focusNextNode() {
    // Start a depth first search and keep going until we reach the currently
    // focused node. Focus the next node in the DFS, if it exists. If it
    // doesn't exist, we're at the last node already.
    const { traversal } = this.state;
    const length = traversal.length;
    let i = 0;

    while (i < length) {
      if (traversal[i].item === this.props.focused) {
        break;
      }
      i++;
    }

    if (i + 1 < traversal.length) {
      this._focus(traversal[i + 1].item, { alignTo: "bottom" });
    }
  }

  /**
   * Handles the left arrow key, going back up to the current rows'
   * parent row.
   */
  _focusParentNode() {
    const parent = this.props.getParent(this.props.focused);
    if (!parent) {
      this._focusPrevNode(this.props.focused);
      return;
    }

    const { traversal } = this.state;
    const length = traversal.length;
    let parentIndex = 0;
    for (; parentIndex < length; parentIndex++) {
      if (traversal[parentIndex].item === parent) {
        break;
      }
    }

    this._focus(parent, { alignTo: "top" });
  }

  _focusFirstNode() {
    const { traversal } = this.state;
    this._focus(traversal[0].item, { alignTo: "top" });
  }

  _focusLastNode() {
    const { traversal } = this.state;
    const lastIndex = traversal.length - 1;
    this._focus(traversal[lastIndex].item, { alignTo: "bottom" });
  }

  _activateNode() {
    if (this.props.onActivate) {
      this.props.onActivate(this.props.focused);
    }
  }

  _nodeIsExpandable(item) {
    return this.props.isExpandable
      ? this.props.isExpandable(item)
      : !!this.props.getChildren(item).length;
  }

  calculateSpaces(start, end) {
    const { traversal } = this.state;
    const { itemHeight } = this.props;

    const totalSpace = traversal.length * itemHeight;

    let topSpace = start * itemHeight;
    let bottomSpace = totalSpace - topSpace - itemHeight * (end - start + 1);

    if (bottomSpace < 0) {
      bottomSpace = 0;
    }
    if (topSpace < 0) {
      topSpace = 0;
    }

    return { topSpace, bottomSpace };
  }

  calculateSpace(traversal) {
    const { parent } = this;
    const { itemHeight } = this.props;

    if (!parent || !itemHeight) {
      // We don't use virtual scrolling if
      // no scrollbar or not fixed height of items,
      return {
        topSpace: 0,
        bottomSpace: 0,
        start: 0,
        end: traversal.length - 1
      };
    }

    const { clientHeight, scrollTop } = parent;
    const itemsInViewPort = Math.floor(clientHeight / itemHeight);

    let start = Math.floor(scrollTop / itemHeight) - NUMBER_OF_EXTRA_ITEMS;
    let end = start + itemsInViewPort + 2 * NUMBER_OF_EXTRA_ITEMS;

    if (start < 0) {
      start = 0;
    }
    if (end >= traversal.length) {
      end = traversal.length - 1;
    }

    const { topSpace, bottomSpace } = this.calculateSpaces(start, end);

    return {
      topSpace,
      bottomSpace,
      start,
      end
    };
  }

  render() {
    const { focused } = this.props;
    const { visibleTraversal, topSpace, bottomSpace } = this.state;

    const nodes = visibleTraversal.map((v, i) => {
      const { item, depth } = visibleTraversal[i];
      const key = this.props.getKey(item, i);
      return TreeNodeFactory({
        key,
        id: key,
        index: i,
        item,
        depth,
        renderItem: this.props.renderItem,
        focused: focused === item,
        expanded: this.props.isExpanded(item),
        isExpandable: this._nodeIsExpandable(item),
        onExpand: this._onExpand,
        onCollapse: this._onCollapse,
        onClick: e => {
          // Since the user just clicked the node, there's no need to check if
          // it should be scrolled into view.
          this._focus(item, { preventAutoScroll: true });
          if (this.props.isExpanded(item)) {
            this._onCollapse(item);
          } else {
            this._onExpand(item, false);
          }
        }
      });
    });

    const style = Object.assign({}, this.props.style || {}, {
      padding: 0,
      margin: 0
    });

    return dom.div(
      {
        className: `tree ${this.props.className ? this.props.className : ""}`,
        ref: el => {
          this.treeRef = el;
        },
        role: "tree",
        tabIndex: "0",
        onKeyDown: this._onKeyDown,
        onKeyPress: this._preventArrowKeyScrolling,
        onKeyUp: this._preventArrowKeyScrolling,
        onFocus: ({ nativeEvent }) => {
          if (focused || !nativeEvent || !this.treeRef) {
            return;
          }

          const { explicitOriginalTarget } = nativeEvent;
          // Only set default focus to the first tree node if the focus came
          // from outside the tree (e.g. by tabbing to the tree from other
          // external elements).
          if (
            explicitOriginalTarget !== this.treeRef &&
            !this.treeRef.contains(explicitOriginalTarget)
          ) {
            this._focus(visibleTraversal[0].item);
          }
        },
        onBlur: this._onBlur,
        "aria-label": this.props.label,
        "aria-labelledby": this.props.labelledby,
        "aria-activedescendant": focused && this.props.getKey(focused),
        style
      },
      [
        dom.div({ key: "top-space", style: { height: topSpace } }, ""),
        nodes,
        dom.div({ key: "bottom-space", style: { height: bottomSpace } }, "")
      ]
    );
  }
}

export default Tree;
