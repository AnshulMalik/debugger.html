/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import React, { Component } from "react";
import ReactDOM from "react-dom";
import { range, isEmpty } from "lodash";
import Svg from "../shared/Svg";
import { connect } from "../../utils/connect";
import { getBlackboxedFunctions, getSelectedLocation } from "../../selectors";

type Props = {
  highlightedLineRange: Object,
  editor: Object
};

const breakpointSvg = document.createElement("div");
ReactDOM.render(<Svg name="breakpoint" />, breakpointSvg);

function makeMarker() {
  const bp = breakpointSvg.cloneNode(true);
  bp.className = "editor blackboxed-function";

  return bp;
}

class HighlightFunctions extends Component<Props> {
  functions: Array<any>;
  constructor(props) {
    super(props);
    this.markers = [];
    this.highlight = this.highlight.bind(this);
    this.clearHighlight = this.clearHighlight.bind(this);
  }

  componentDidMount() {
    this.highlight();
  }

  componentDidUpdate() {
    this.highlight();
  }

  clearHighlight() {
    const {
      editor: { codeMirror }
    } = this.props;
    codeMirror.operation(() => {
      this.markers.forEach(mark => {
        mark.lines.forEach(line => {
          codeMirror.doc.removeLineClass(line, "gutter", "blackboxed-function");
        });
        mark.clear();
      });
      // codeMirror.clearGutter("blackbox");
    });
  }

  highlight = () => {
    const { functions, editor } = this.props;

    const { codeMirror } = editor;

    if (!functions || !codeMirror) {
      return;
    }

    this.clearHighlight();

    codeMirror.operation(() => {
      this.markers = functions.map(({ location: { start, end } }) => {
        for (let l = start.line - 1; l < end.line; l++) {
          codeMirror.doc.addLineClass(l, "gutter", "blackboxed-function");
        }
        return codeMirror.doc.markText(
          {
            line: start.line - 1,
            ch: start.column
          },
          {
            line: end.line - 1,
            ch: end.column
          },
          {
            className: "highlight-lines"
          }
        );
      });
    });
  };

  render() {
    return null;
  }
}

export default connect(state => ({
  functions: getBlackboxedFunctions(state, getSelectedLocation(state).sourceId)
}))(HighlightFunctions);
