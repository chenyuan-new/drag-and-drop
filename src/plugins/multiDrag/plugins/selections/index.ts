import type {
  SetupNodeData,
  NodeEventData,
  TearDownNodeData,
  ParentConfig,
} from "../../../../types";

import type { SelectionsConfig } from "./types";

import { parents, nodeEventData } from "../../../../index";

import { addEvents, removeClass, addClass } from "../../../../utils";

import { multiDragState } from "../../index";

export function selections(selectionsConfig: SelectionsConfig = {}) {
  return (parent: HTMLElement) => {
    const parentData = parents.get(parent);

    if (!parentData) return;

    return {
      setup() {
        parentData.config.selectionsConfig = selectionsConfig;

        parentData.config.handleClick =
          selectionsConfig.handleClick || handleClick;

        parentData.config.handleKeydown =
          selectionsConfig.handleKeydown || handleKeydown;

        selectionsConfig.clickawayDeselect =
          selectionsConfig.clickawayDeselect === undefined
            ? true
            : selectionsConfig.clickawayDeselect;

        if (!selectionsConfig.clickawayDeselect) return;

        const rootAbortControllers = addEvents(parentData.config.root, {
          click: handleRootClick.bind(null, parentData.config),
        });

        parentData.abortControllers["root"] = rootAbortControllers;
      },

      teardownNode(data: TearDownNodeData) {
        if (data.parentData.abortControllers.mainNode) {
          data.parentData.abortControllers.mainNode.abort();
        }
      },

      setupNode(data: SetupNodeData) {
        const config = data.parentData.config;

        data.node.setAttribute("tabindex", "0");

        const abortControllers = addEvents(data.node, {
          click: nodeEventData(config.handleClick),
          keydown: nodeEventData(config.handleKeydown),
        });

        data.nodeData.abortControllers["selectionsNode"] = abortControllers;
      },
    };
  };
  //return {
  //  s(parent: HTMLElement, config: Config) {
  //    const parentData = state.parentData.get(parent);
  //    if (!parentData) return;
  //    multiDragConfig.multiDragstart = multiDragstart;
  //    parentData.multiDragConfig = multiDragConfig;
  //    state.parentData.set(parent, {
  //      ...parentData,
  //    });
  //    document.addEventListener("click", docClick);
  //    document.addEventListener("keydown", keydown);
  //    const parentConfig = parentData.config;
  //    if (
  //      !parentConfig ||
  //      !parentConfig.setDraggable ||
  //      !parentConfig.removeDraggable
  //    )
  //      return;
  //    const setDraggable = parentConfig.setDraggable;
  //    parentConfig.setDraggable = (node: Node) => {
  //      setDraggable(node);
  //      setEvents(node);
  //      return node;
  //    };
  //    const removeDraggable = parentConfig.removeDraggable;
  //    state.removeDraggable = (el: Node) => {
  //      removeDraggable(el);
  //      removeEvents(el);
  //      return el;
  //    };
  //  },
  //  tearDown(parent: HTMLElement) {
  //    document.removeEventListener("click", docClick);
  //    document.removeEventListener("keydown", keydown);
  //    const parentData = state.parentData.get(parent);
  //    if (!parentData) return;
  //    delete parentData.multiDragConfig;
  //  },
  //};
}

function handleRootClick(config: ParentConfig) {
  for (const nodeRecord of multiDragState.selectedNodes) {
    nodeRecord.el.classList.remove(config.selectionsConfig.selectedClass);
  }

  multiDragState.selectedNodes = [];
}

function handleKeydown(data: NodeEventData) {
  keydown(data);
}

function handleClick(data: NodeEventData) {
  click(data);
}

function click(data: NodeEventData) {
  data.e.stopPropagation();

  const selectionsConfig = data.targetData.parent.data.config.selectionsConfig;

  let commandKey;

  let shiftKey;

  if (data.e instanceof MouseEvent) {
    commandKey = data.e.ctrlKey || data.e.metaKey;

    shiftKey = data.e.shiftKey;
  }

  const ctParentData = data.targetData.parent.data;

  const selectedClass = selectionsConfig.selectedClass;

  const targetNode = data.targetData.node;

  if (shiftKey) {
    if (!multiDragState.activeNode) {
      multiDragState.activeNode = {
        el: data.targetData.node.el,
        data: data.targetData.node.data,
      };

      for (let x = 0; x <= data.targetData.node.data.index; x++) {
        multiDragState.selectedNodes.push(ctParentData.enabledNodes[x]);
        if (selectedClass) {
          addClass([ctParentData.enabledNodes[x].el], selectedClass);
        }
      }
    } else {
      const [minIndex, maxIndex] =
        multiDragState.activeNode.data.index < data.targetData.node.data.index
          ? [
              multiDragState.activeNode.data.index,
              data.targetData.node.data.index,
            ]
          : [
              data.targetData.node.data.index,
              multiDragState.activeNode.data.index,
            ];

      const selectedNodes = ctParentData.enabledNodes.slice(
        minIndex,
        maxIndex + 1
      );

      if (selectedNodes.length === 1) {
        for (const node of multiDragState.selectedNodes) {
          if (selectedClass) node.el.classList.remove(selectedClass);
        }

        multiDragState.selectedNodes = [
          {
            el: data.targetData.node.el,
            data: data.targetData.node.data,
          },
        ];

        multiDragState.activeNode = {
          el: data.targetData.node.el,
          data: data.targetData.node.data,
        };

        if (selectedClass) {
          data.targetData.node.el.classList.add(selectedClass);
        }
      }
      for (let x = minIndex - 1; x >= 0; x--) {
        if (
          multiDragState.selectedNodes.includes(ctParentData.enabledNodes[x])
        ) {
          multiDragState.selectedNodes = [
            ...multiDragState.selectedNodes.filter(
              (el) => el !== ctParentData.enabledNodes[x]
            ),
          ];

          if (selectedClass) {
            addClass([ctParentData.enabledNodes[x].el], selectedClass);
          }
        } else {
          break;
        }
      }
      for (let x = maxIndex; x < ctParentData.enabledNodes.length; x++) {
        if (
          multiDragState.selectedNodes.includes(ctParentData.enabledNodes[x])
        ) {
          multiDragState.selectedNodes = [
            ...multiDragState.selectedNodes.filter(
              (el) => el !== ctParentData.enabledNodes[x]
            ),
          ];
          if (selectedClass) {
            removeClass([ctParentData.enabledNodes[x].el], selectedClass);
          }
        } else {
          break;
        }
      }
      for (const node of selectedNodes) {
        if (!multiDragState.selectedNodes.map((x) => x.el).includes(node.el)) {
          multiDragState.selectedNodes.push(node);
        }

        if (selectedClass) {
          addClass([node.el], selectedClass);
        }
      }
    }
  } else if (!commandKey) {
    if (multiDragState.selectedNodes.map((x) => x.el).includes(targetNode.el)) {
      multiDragState.selectedNodes = multiDragState.selectedNodes.filter(
        (el) => el.el !== targetNode.el
      );
      if (selectedClass) {
        removeClass([targetNode.el], selectedClass);
      }
    } else {
      multiDragState.activeNode = {
        el: data.targetData.node.el,
        data: data.targetData.node.data,
      };

      if (selectedClass) {
        for (const el of multiDragState.selectedNodes) {
          removeClass([el.el], selectedClass);
        }

        addClass([data.targetData.node.el], selectedClass);
      }
      multiDragState.selectedNodes = [
        {
          el: data.targetData.node.el,
          data: data.targetData.node.data,
        },
      ];
    }
  } else if (commandKey) {
    if (multiDragState.selectedNodes.map((x) => x.el).includes(targetNode.el)) {
      multiDragState.selectedNodes = multiDragState.selectedNodes.filter(
        (el) => el.el !== targetNode.el
      );
      if (selectedClass) {
        removeClass([targetNode.el], selectedClass);
      }
    } else {
      multiDragState.activeNode = targetNode;
      if (selectedClass) {
        addClass([targetNode.el], selectedClass);
      }
      multiDragState.selectedNodes.push(targetNode);
    }
    //if (multiDragConfig.selected) {
    //  //const nodeData = multiDragState.nodeData.get(e.currentTarget);
    //  //if (!nodeData) return;
    //  multiDragConfig.selected({
    //    el: e.currentTarget,
    //    nodeData,
    //    parent: e.currentTarget.parentNode as HTMLElement,
    //    parentData: ctParentData,
    //  });
  }
}

function keydown(data: NodeEventData) {
  if (!(data.e instanceof KeyboardEvent)) return;

  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

  if (!keys.includes(data.e.key) || !multiDragState.activeNode) return;

  const selectionsConfig = data.targetData.parent.data.config.selectionsConfig;

  data.e.preventDefault();

  const parentData = data.targetData.parent.data;

  const nodeData = data.targetData.node.data;

  const enabledNodes = parentData.enabledNodes;

  const invalidKeydown =
    ((data.e.key === "ArrowUp" || data.e.key === "ArrowRight") &&
      nodeData.index === 0) ||
    ((data.e.key === "ArrowDown" || data.e.key === "ArrowLeft") &&
      nodeData.index === enabledNodes.length - 1);

  if (invalidKeydown) return;

  const moveUp = data.e.key === "ArrowUp" || data.e.key === "ArrowLeft";

  const adjacentNode = enabledNodes[nodeData.index + (moveUp ? -1 : 1)];

  const selectedClass = selectionsConfig.selectedClass;

  if (!adjacentNode) return;

  if (data.e.altKey) {
    if (multiDragState.selectedNodes.length > 1) {
      for (const el of multiDragState.selectedNodes) {
        if (selectedClass && multiDragState.activeNode !== el) {
          removeClass([el.el], selectedClass);
        }
      }

      multiDragState.selectedNodes = multiDragState.selectedNodes.filter(
        (el) => el !== multiDragState.activeNode
      );
    }
    const parentValues = [parentData.getValues(data.targetData.parent.el)];

    [
      parentValues[nodeData.index],
      parentValues[nodeData.index + (moveUp ? -1 : 1)],
    ] = [
      parentValues[nodeData.index + (moveUp ? -1 : 1)],
      parentValues[nodeData.index],
    ];

    parentData.setValues(parentValues, data.targetData.parent.el);
  } else if (data.e.shiftKey) {
    if (
      !multiDragState.selectedNodes.map((x) => x.el).includes(adjacentNode.el)
    ) {
      multiDragState.selectedNodes.push(adjacentNode);

      if (selectedClass) {
        addClass([adjacentNode.el], selectedClass);
      }

      multiDragState.activeNode = adjacentNode;
    } else {
      if (
        multiDragState.selectedNodes
          .map((x) => x.el)
          .includes(multiDragState.activeNode.el)
      ) {
        multiDragState.selectedNodes = multiDragState.selectedNodes.filter(
          (el) => el !== multiDragState.activeNode
        );

        if (selectedClass) {
          removeClass([multiDragState.activeNode.el], selectedClass);
        }

        multiDragState.activeNode = adjacentNode;
      }
    }
  } else {
    for (const el of multiDragState.selectedNodes) {
      if (selectedClass && multiDragState.activeNode !== el) {
        removeClass([el.el], selectedClass);
      }
    }

    removeClass([multiDragState.activeNode.el], selectedClass);

    multiDragState.selectedNodes = [adjacentNode];

    addClass([adjacentNode.el], selectedClass);

    multiDragState.activeNode = adjacentNode;
  }

  data.targetData.node.el.blur();

  multiDragState.activeNode = adjacentNode;

  multiDragState.activeNode.el.focus();
}
