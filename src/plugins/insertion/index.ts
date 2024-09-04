import type { InsertionConfig, InsertionParentConfig } from "./types";
import type {
  DragState,
  NodeDragEventData,
  NodeRecord,
  ParentEventData,
  NodePointerEventData,
  PointeroverParentEvent,
  ParentRecord,
} from "../../types";
import {
  dragstart,
  handleScroll,
  handleEnd as originalHandleEnd,
  parents,
  parentValues,
  setParentValues,
  state,
  addParentClass,
  pointerdown,
} from "../../index";
import { eventCoordinates, removeClass } from "../../utils";

export const insertionState = {
  draggedOverNodes: Array<NodeRecord<any>>(),
  draggedOverParent: null as ParentRecord<any> | null,
  targetIndex: 0,
  ascending: false,
};

// WIP: This is a work in progress and not yet fully functional
export function insertion<T>(
  insertionConfig: Partial<InsertionConfig<T>> = {}
) {
  return (parent: HTMLElement) => {
    const parentData = parents.get(parent);

    if (!parentData) return;

    const insertionParentConfig = {
      ...parentData.config,
      insertionConfig: insertionConfig,
    } as InsertionParentConfig<T>;

    return {
      teardown() {
        if (parentData.abortControllers.root) {
          parentData.abortControllers.root.abort();
        }
      },
      setup() {
        insertionParentConfig.handleDragstart =
          insertionConfig.handleDragstart || handleDragstart;

        insertionParentConfig.handleDragoverNode =
          insertionConfig.handleDragoverNode || handleDragoverNode;

        insertionParentConfig.handlePointeroverParent =
          insertionConfig.handlePointeroverParent || handlePointeroverParent;

        insertionParentConfig.handlePointeroverNode =
          insertionConfig.handlePointeroverNode || handlePointeroverParent;

        insertionParentConfig.handleDragoverParent =
          insertionConfig.handleDragoverParent || handleDragoverParent;

        insertionParentConfig.handleEnd =
          insertionConfig.handleEnd || handleEnd;

        document.body.addEventListener("dragover", checkPosition);

        document.body.addEventListener("pointermove", checkPosition);

        const observer = new ResizeObserver(() => {
          defineRanges(parent);
        });

        observer.observe(parent);

        parentData.config = insertionParentConfig;

        if (parentData.config.sortable === false) return;

        const insertionPointConfig = insertionConfig.insertionPoint || {};

        const div = document.createElement(insertionPointConfig.tag || "div");

        div.id = insertionPointConfig.id || "insertion-point";

        div.classList.add(
          ...(insertionPointConfig.classes || ["insertion-point"])
        );

        div.style.position = "absolute";

        div.style.display = "none";

        document.body.appendChild(div);

        window.addEventListener("scroll", defineRanges.bind(null, parent));

        window.addEventListener("resize", defineRanges.bind(null, parent));
      },

      remapFinished() {
        defineRanges(parent);
      },
    };
  };
}

function checkPosition(e: DragEvent | PointerEvent) {
  if (!state) return;

  const el = document.elementFromPoint(e.clientX, e.clientY);

  if (!(el instanceof HTMLElement)) return;

  if (!parents.has(el)) {
    const insertionPoint = document.getElementById("insertion-point");

    if (insertionPoint && insertionPoint === el) return;

    if (insertionPoint) insertionPoint.style.display = "none";

    if (insertionState.draggedOverParent) {
      removeClass(
        [insertionState.draggedOverParent.el],
        insertionState.draggedOverParent.data.config.dropZoneClass
      );
    }

    insertionState.draggedOverNodes = [];

    insertionState.draggedOverParent = null;

    state.lastParent = state.initialParent;
  }
}

export function handleDragstart<T>(data: NodeDragEventData<T>) {
  if (!(data.e instanceof DragEvent)) return;

  dragstart({
    e: data.e,
    targetData: data.targetData,
  });

  setTimeout(() => {
    if (data.targetData.parent.data.config.sortable === false) return;

    defineRanges(data.targetData.parent.el);
  });
}

export function handlePointerdown<T>(data: NodePointerEventData<T>) {
  if (!(data.e instanceof PointerEvent)) return;

  pointerdown({
    e: data.e,
    targetData: data.targetData,
  });

  setTimeout(() => {
    if (data.targetData.parent.data.config.sortable === false) return;

    defineRanges(data.targetData.parent.el);
  });
}

function ascendingVertical(
  nodeCoords: Coordinates,
  nextNodeCoords?: Coordinates
) {
  const center = nodeCoords.top + nodeCoords.height / 2;

  if (!nextNodeCoords) {
    return {
      y: [center, center + nodeCoords.height / 2 + 10],
      x: [nodeCoords.left, nodeCoords.right],
      vertical: true,
    };
  }

  return {
    y: [
      center,
      nodeCoords.bottom + Math.abs(nodeCoords.bottom - nextNodeCoords.top) / 2,
    ],
    x: [nodeCoords.left, nodeCoords.right],
    vertical: true,
  };
}

function descendingVertical(
  nodeCoords: Coordinates,
  prevNodeCoords?: Coordinates
) {
  const center = nodeCoords.top + nodeCoords.height / 2;

  if (!prevNodeCoords) {
    return {
      y: [center - nodeCoords.height / 2 - 10, center],
      x: [nodeCoords.left, nodeCoords.right],
      vertical: true,
    };
  }

  return {
    y: [
      prevNodeCoords.bottom +
        Math.abs(prevNodeCoords.bottom - nodeCoords.top) / 2,
      center,
    ],
    x: [nodeCoords.left, nodeCoords.right],
    vertical: true,
  };
}

function ascendingHorizontal(
  nodeCoords: Coordinates,
  nextNodeCoords?: Coordinates,
  lastInRow = false
) {
  const center = nodeCoords.left + nodeCoords.width / 2;

  if (!nextNodeCoords) {
    return {
      x: [center, center + nodeCoords.width],
      y: [nodeCoords.top, nodeCoords.bottom],
      vertical: false,
    };
  }

  if (lastInRow) {
    return {
      x: [center, nodeCoords.right + 10],
      y: [nodeCoords.top, nodeCoords.bottom],
      vertical: false,
    };
  } else {
    const nextNodeCenter = nextNodeCoords.left + nextNodeCoords.width / 2;

    return {
      x: [center, center + Math.abs(center - nextNodeCenter) / 2],
      y: [nodeCoords.top, nodeCoords.bottom],
      vertical: false,
    };
  }
}

function descendingHorizontal(
  nodeCoords: Coordinates,
  prevNodeCoords?: Coordinates
) {
  const center = nodeCoords.left + nodeCoords.width / 2;

  if (!prevNodeCoords) {
    return {
      x: [nodeCoords.left - 10, center],
      y: [nodeCoords.top, nodeCoords.bottom],
      vertical: false,
    };
  }

  return {
    x: [
      prevNodeCoords.right +
        Math.abs(prevNodeCoords.right - nodeCoords.left) / 2,
      center,
    ],
    y: [nodeCoords.top, nodeCoords.bottom],
    vertical: false,
  };
}

interface Coordinates {
  top: number;
  bottom: number;
  left: number;
  right: number;
  height: number;
  width: number;
}

function getRealCoords(el: HTMLElement): Coordinates {
  const { top, bottom, left, right, height, width } =
    el.getBoundingClientRect();

  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  const adjustedTop = top + scrollTop;
  const adjustedBottom = bottom + scrollTop;
  const adjustedLeft = left + scrollLeft;
  const adjustedRight = right + scrollLeft;

  return {
    top: adjustedTop,
    bottom: adjustedBottom,
    left: adjustedLeft,
    right: adjustedRight,
    height,
    width,
  };
}

function defineRanges(parent: HTMLElement) {
  const parentData = parents.get(parent);

  if (!parentData) return;

  const enabledNodes = parentData.enabledNodes;

  enabledNodes.forEach((node, index) => {
    node.data.range = {};

    let aboveOrBelowPrevious = false;

    let aboveOrBelowAfter = false;

    let prevNodeCoords = undefined;

    let nextNodeCoords = undefined;

    if (enabledNodes[index - 1])
      prevNodeCoords = getRealCoords(enabledNodes[index - 1].el);

    if (enabledNodes[index + 1])
      nextNodeCoords = getRealCoords(enabledNodes[index + 1].el);

    const nodeCoords = getRealCoords(node.el);

    if (prevNodeCoords) {
      aboveOrBelowPrevious =
        nodeCoords.top > prevNodeCoords.bottom ||
        nodeCoords.bottom < prevNodeCoords.top;
    }

    if (nextNodeCoords) {
      aboveOrBelowAfter =
        nodeCoords.top > nextNodeCoords.bottom ||
        nodeCoords.bottom < nextNodeCoords.top;
    }

    const fullishWidth =
      parent.getBoundingClientRect().width * 0.8 < nodeCoords.width;

    if (fullishWidth) {
      node.data.range.ascending = ascendingVertical(nodeCoords, nextNodeCoords);
      node.data.range.descending = descendingVertical(
        nodeCoords,
        prevNodeCoords
      );
    } else if (aboveOrBelowAfter && !aboveOrBelowPrevious) {
      node.data.range.ascending = ascendingHorizontal(
        nodeCoords,
        nextNodeCoords,
        true
      );
      node.data.range.descending = descendingHorizontal(
        nodeCoords,
        prevNodeCoords
      );
    } else if (!aboveOrBelowPrevious && !aboveOrBelowAfter) {
      node.data.range.ascending = ascendingHorizontal(
        nodeCoords,
        nextNodeCoords
      );
      node.data.range.descending = descendingHorizontal(
        nodeCoords,
        prevNodeCoords
      );
    } else if (aboveOrBelowPrevious && !nextNodeCoords) {
      node.data.range.ascending = ascendingHorizontal(nodeCoords);
    } else if (aboveOrBelowPrevious && !aboveOrBelowAfter) {
      node.data.range.ascending = ascendingHorizontal(
        nodeCoords,
        nextNodeCoords
      );

      node.data.range.descending = descendingHorizontal(nodeCoords);
    }
  });
}

export function handleDragoverNode<T>(data: NodeDragEventData<T>) {
  data.e.preventDefault();
}

export function handleDragoverParent<T>(data: ParentEventData<T>) {
  if (!state || !insertionState) return;

  data.e.stopPropagation();

  data.e.preventDefault();

  const { x, y } = eventCoordinates(data.e as DragEvent | PointerEvent);

  // Get the client coordinates
  const clientX = x;
  const clientY = y;

  // Get the scroll positions
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // Calculate the coordinates relative to the entire document
  state.coordinates.x = clientX + scrollLeft;
  state.coordinates.y = clientY + scrollTop;

  const nestedParent = data.targetData.parent.data.nestedParent;

  let realTargetParent = data.targetData.parent;

  if (nestedParent) {
    const rect = nestedParent.el.getBoundingClientRect();

    if (state.coordinates.y > rect.top && state.coordinates.y < rect.bottom)
      realTargetParent = nestedParent;
  }

  realTargetParent.el === state.lastParent?.el
    ? moveBetween(realTargetParent)
    : moveOutside(realTargetParent, state);

  state.lastParent = realTargetParent;
}

export function moveBetween<T>(data: ParentRecord<T>) {
  if (data.data.config.sortable === false) return;

  if (
    data.el === insertionState.draggedOverParent?.el &&
    insertionState.draggedOverParent.data.getValues(data.el).length === 0
  ) {
    return;
  } else if (insertionState.draggedOverParent?.el) {
    removeClass(
      [insertionState.draggedOverParent.el],
      insertionState.draggedOverParent.data.config.dropZoneClass
    );
    insertionState.draggedOverParent = null;
  }

  const foundRange = findClosest(data.data.enabledNodes);

  if (!foundRange) return;

  const position = foundRange[0].data.range[foundRange[1]];

  positionInsertionPoint(
    position,
    foundRange[1] === "ascending",
    foundRange[0]
  );
}

function moveOutside<T>(data: ParentRecord<T>, state: DragState<T>) {
  if (data.el === state.lastParent.el) return false;

  const targetConfig = data.data.config;

  if (targetConfig.treeGroup && state.draggedNode.el.contains(data.el))
    return false;

  if (targetConfig.dropZone === false) return false;

  const initialParentConfig = state.initialParent.data.config;

  if (targetConfig.accepts) {
    return targetConfig.accepts(
      data,
      state.initialParent,
      state.lastParent,
      state
    );
  } else if (
    !targetConfig.group ||
    targetConfig.group !== initialParentConfig.group
  ) {
    return false;
  }

  const values = data.data.getValues(data.el);

  if (!values.length) {
    addParentClass([data.el], targetConfig.dropZoneClass);

    insertionState.draggedOverParent = data;

    const insertionPoint = document.getElementById("insertion-point");

    if (insertionPoint) insertionPoint.style.display = "none";
  } else {
    removeClass([state.lastParent.el], targetConfig.dropZoneClass);

    const enabledNodes = data.data.enabledNodes;

    const foundRange = findClosest(enabledNodes);

    if (!foundRange) return;

    const position = foundRange[0].data.range[foundRange[1]];

    positionInsertionPoint(
      position,
      foundRange[1] === "ascending",
      foundRange[0]
    );
  }
}

function findClosest<T>(enabledNodes: NodeRecord<T>[]) {
  let foundRange: [NodeRecord<T>, string] | null = null;

  for (let x = 0; x < enabledNodes.length; x++) {
    if (!state || !enabledNodes[x].data.range) continue;

    if (enabledNodes[x].data.range.ascending) {
      if (
        state.coordinates.y > enabledNodes[x].data.range.ascending.y[0] &&
        state.coordinates.y < enabledNodes[x].data.range.ascending.y[1] &&
        state.coordinates.x > enabledNodes[x].data.range.ascending.x[0] &&
        state.coordinates.x < enabledNodes[x].data.range.ascending.x[1]
      ) {
        foundRange = [enabledNodes[x], "ascending"];

        return foundRange;
      }
    }

    if (enabledNodes[x].data.range.descending) {
      if (
        state.coordinates.y > enabledNodes[x].data.range.descending.y[0] &&
        state.coordinates.y < enabledNodes[x].data.range.descending.y[1] &&
        state.coordinates.x > enabledNodes[x].data.range.descending.x[0] &&
        state.coordinates.x < enabledNodes[x].data.range.descending.x[1]
      ) {
        foundRange = [enabledNodes[x], "descending"];

        return foundRange;
      }
    }
  }
}

export function handlePointeroverParent<T>(data: PointeroverParentEvent<T>) {
  if (!state || !insertionState) return;

  data.detail.e.stopPropagation();

  const { x, y } = eventCoordinates(data.detail.e as PointerEvent);

  state.coordinates.y = y;

  state.coordinates.x = x;

  handleScroll();

  const nestedParent = data.detail.targetData.parent.data.nestedParent;

  let realTargetParent = data.detail.targetData.parent;

  if (nestedParent) {
    const rect = nestedParent.el.getBoundingClientRect();

    if (state.coordinates.y > rect.top && state.coordinates.y < rect.bottom)
      realTargetParent = nestedParent;
  }

  const enabledNodes = realTargetParent.data.enabledNodes;

  const foundRange = findClosest(enabledNodes);

  if (!foundRange) return;

  const position = foundRange[0].data.range[foundRange[1]];

  positionInsertionPoint(
    position,
    foundRange[1] === "ascending",
    foundRange[0]
  );

  data.detail.targetData.parent.el === state.lastParent?.el
    ? moveBetween(realTargetParent)
    : moveOutside(realTargetParent, state);
}

function positionInsertionPoint<T>(
  position: { x: number[]; y: number[]; vertical: boolean },
  ascending: boolean,
  node: NodeRecord<T>
) {
  if (!state) return;

  const div = document.getElementById("insertion-point");

  if (!div) return;

  insertionState.draggedOverNodes = [node];

  if (position.vertical) {
    const topPosition =
      position.y[ascending ? 1 : 0] - div.getBoundingClientRect().height / 2;

    div.style.top = `${topPosition}px`;

    const leftCoordinate = position.x[0];

    const rightCoordinate = position.x[1];

    div.style.left = `${leftCoordinate}px`;

    div.style.right = `${rightCoordinate}px`;

    div.style.height = "4px";

    div.style.width = rightCoordinate - leftCoordinate + "px";
  } else {
    const leftPosition =
      position.x[ascending ? 1 : 0] - div.getBoundingClientRect().width / 2;
    div.style.left = `${leftPosition}px`;

    const topCoordinate = position.y[0];

    const bottomCoordinate = position.y[1];

    div.style.top = `${topCoordinate}px`;

    div.style.bottom = `${bottomCoordinate}px`;

    div.style.width = "4px";

    div.style.height = bottomCoordinate - topCoordinate + "px";
  }

  insertionState.targetIndex = node.data.index;

  insertionState.ascending = ascending;

  div.style.display = "block";
}

export function handleParentDrop<T>(_data: NodeDragEventData<T>) {}

export function handleEnd<T>(
  data: NodeDragEventData<T> | NodePointerEventData<T>
) {
  data.e.stopPropagation();

  if (!state) return;

  const insertionPoint = document.getElementById("insertion-point");

  if (!insertionState.draggedOverParent) {
    const draggedParentValues = parentValues(
      state.initialParent.el,
      state.initialParent.data
    );

    const transferred = state.initialParent.el !== state.lastParent.el;

    const draggedValues = state.draggedNodes.map((node) => node.data.value);

    const enabledNodes = [...data.targetData.parent.data.enabledNodes];

    const originalIndex = state.draggedNodes[0].data.index;

    if (
      !transferred &&
      insertionState.draggedOverNodes[0] &&
      insertionState.draggedOverNodes[0].el !== state.draggedNodes[0].el
    ) {
      const newParentValues = [
        ...draggedParentValues.filter((x) => !draggedValues.includes(x)),
      ];

      let index = insertionState.draggedOverNodes[0].data.index;

      if (
        insertionState.targetIndex > state.draggedNodes[0].data.index &&
        !insertionState.ascending
      ) {
        index--;
      } else if (
        insertionState.targetIndex < state.draggedNodes[0].data.index &&
        insertionState.ascending
      ) {
        index++;
      }

      newParentValues.splice(index, 0, ...draggedValues);

      setParentValues(data.targetData.parent.el, data.targetData.parent.data, [
        ...newParentValues,
      ]);

      if (data.targetData.parent.data.config.onSort) {
        const sortEventData = {
          parent: {
            el: data.targetData.parent.el,
            data: data.targetData.parent.data,
          },
          previousValues: [...draggedParentValues],
          previousNodes: [...enabledNodes],
          nodes: [...data.targetData.parent.data.enabledNodes],
          values: [...newParentValues],
          draggedNode: state.draggedNode,
          previousPosition: originalIndex,
          position: index,
        };

        data.targetData.parent.data.config.onSort(sortEventData);
      }
    } else if (transferred && insertionState.draggedOverNodes.length) {
      const targetParentValues = parentValues(
        state.lastParent.el,
        state.lastParent.data
      );
      const draggedParentValues = parentValues(
        state.initialParent.el,
        state.initialParent.data
      );

      // For the time being, we will not be remoing the value of the original dragged parent.
      let index = insertionState.draggedOverNodes[0].data.index || 0;

      if (insertionState.ascending) index++;

      const insertValues = state.dynamicValues.length
        ? state.dynamicValues
        : draggedValues;
      targetParentValues.splice(index, 0, ...insertValues);
      setParentValues(state.lastParent.el, state.lastParent.data, [
        ...targetParentValues,
      ]);
      draggedParentValues.splice(state.initialIndex, draggedValues.length);
      setParentValues(state.initialParent.el, state.initialParent.data, [
        ...draggedParentValues,
      ]);

      const transferEventData = {
        sourceParent: state.lastParent,
        targetParent: data.targetData.parent,
        previousSourceValues: [...targetParentValues],
        sourceValues: [...state.lastParent.data.getValues(state.lastParent.el)],
        previousTargetValues: [...targetParentValues],
        targetValues: [
          ...data.targetData.parent.data.getValues(data.targetData.parent.el),
        ],
        previousSourceNodes: [...state.lastParent.data.enabledNodes],
        sourceNodes: [...state.lastParent.data.enabledNodes],
        previousTargetNodes: [...data.targetData.parent.data.enabledNodes],
        targetNodes: [...data.targetData.parent.data.enabledNodes],
        draggedNode: state.draggedNode,
        sourcePreviousPosition: state.initialIndex,
        targetPosition: index,
      };
      if (data.targetData.parent.data.config.onTransfer)
        data.targetData.parent.data.config.onTransfer(transferEventData);
      if (state.lastParent.data.config.onTransfer)
        state.lastParent.data.config.onTransfer(transferEventData);
    }
  } else if (insertionState.draggedOverParent) {
    const draggedOverParentValues = parentValues(
      insertionState.draggedOverParent.el,
      insertionState.draggedOverParent.data
    );

    const draggedValues = state.draggedNodes.map((node) => node.data.value);

    const insertValues = state.dynamicValues.length
      ? state.dynamicValues
      : draggedValues;

    draggedOverParentValues.push(...insertValues);

    setParentValues(
      insertionState.draggedOverParent.el,
      insertionState.draggedOverParent.data,
      [...draggedOverParentValues]
    );

    const transferEventData = {
      sourceParent: state.lastParent,
      targetParent: data.targetData.parent,
      previousSourceValues: [...draggedOverParentValues],
      sourceValues: [...state.lastParent.data.getValues(state.lastParent.el)],
      previousTargetValues: [...draggedOverParentValues],
      targetValues: [
        ...data.targetData.parent.data.getValues(data.targetData.parent.el),
      ],
      previousSourceNodes: [...state.lastParent.data.enabledNodes],
      sourceNodes: [...state.lastParent.data.enabledNodes],
      previousTargetNodes: [...data.targetData.parent.data.enabledNodes],
      targetNodes: [...data.targetData.parent.data.enabledNodes],
      draggedNode: state.draggedNode,
      sourcePreviousPosition: state.initialIndex,
      targetPosition: 0,
    };
    if (data.targetData.parent.data.config.onTransfer)
      data.targetData.parent.data.config.onTransfer(transferEventData);
    if (state.lastParent.data.config.onTransfer)
      state.lastParent.data.config.onTransfer(transferEventData);

    removeClass(
      [insertionState.draggedOverParent.el],
      insertionState.draggedOverParent.data.config.dropZoneClass
    );
  }

  if (insertionPoint) insertionPoint.style.display = "none";

  const dropZoneClass =
    "clonedDraggedNode" in state
      ? data.targetData.parent.data.config.synthDropZoneClass
      : data.targetData.parent.data.config.dropZoneClass;

  removeClass(
    insertionState.draggedOverNodes.map((node) => node.el),
    dropZoneClass
  );

  const dragPlaceholderClass =
    data.targetData.parent.data.config.dragPlaceholderClass;

  removeClass(
    state.draggedNodes.map((node) => node.el),
    dragPlaceholderClass
  );

  insertionState.draggedOverNodes = [];

  originalHandleEnd(data);
}
