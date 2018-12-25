/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { isOriginalId, originalToGeneratedId } from "devtools-source-map";
import { recordEvent } from "../../utils/telemetry";
import { features } from "../../utils/prefs";

import { PROMISE } from "../utils/middleware/promise";
import type { Source } from "../../types";
import type { ThunkArgs } from "../types";

export function toggleBlackBox(source: Source) {
  return async ({ dispatch, getState, client, sourceMaps }: ThunkArgs) => {
    const { isBlackBoxed, id } = source;

    if (!isBlackBoxed) {
      recordEvent("blackbox");
    }

    let promise;
    if (features.originalBlackbox && isOriginalId(id)) {
      promise = Promise.resolve({ isBlackBoxed: !isBlackBoxed });
    } else {
      promise = client.blackBox(id, isBlackBoxed);
    }

    return dispatch({
      type: "BLACKBOX",
      source,
      [PROMISE]: promise
    });
  };
}

export function blackboxFunction(sourceId, func) {
  return ({ dispatch, getState, client }: ThunkArgs) => {
    let id = sourceId;
    if (isOriginalId(sourceId)) {
      id = originalToGeneratedId(sourceId);
    }

    return dispatch({
      type: "BLACKBOX_FUNCTION",
      func,
      sourceId,
      [PROMISE]: client.blackBox(id, false, func.location)
    });
  };
}

export function unblackboxFunction(sourceId, func) {
  return ({ dispatch, getState, client }: ThunkArgs) => {
    let id = sourceId;
    if (isOriginalId(sourceId)) {
      id = originalToGeneratedId(sourceId);
    }

    return dispatch({
      type: "UNBLACKBOX_FUNCTION",
      func,
      sourceId,
      [PROMISE]: client.blackBox(id, true, func.location)
    });
  };
}
