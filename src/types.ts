/**
 * The central entry point of the library.
 *
 * @param parent - The parent element that will contain the draggable nodes.
 * @param getValues - A function that returns the values assigned to the parent.
 * @param setValues - A function that sets the values assigned to the parent.
 * @param config - An optional configuration object.
 */
export interface DragAndDrop {
  parent: HTMLElement;
  getValues: (parent: HTMLElement) => Array<any>;
  setValues: (values: Array<any>, parent: HTMLElement) => void;
  config?: Partial<ParentConfig>;
}

/**
 * The function that is called when an event is triggered on a Node.
 *
 * @param data - The data passed to the event listener.
 * @param dragState - The current state of the drag.
 */
export type NodeAction = (data: NodeEventData, dragState: DragState) => void;

/**
 * The function that is called when an event is triggered on a Parent.
 *
 * @param data - The data passed to the event listener.
 * @param dragState - The current state of the drag.
 */
export type ParentAction = (
  data: ParentEventData,
  dragState: DragState | TouchState
) => void;

/**
 * The configuration object for a given parent.
 *
 * @param accepts - A function that returns whether a given parent accepts a
 * dragged node.
 * @param disabled - A flag to disable dragability of all nodes in the parent.
 * @param dragHandle - A selector for the drag handle. Will search at any depth
 * within the node.
 * @param draggable - A function that returns whether a given node is draggable.
 * @param draggingClass - The class to add to a node when it is being dragged.
 * @param dropZoneClass - The class to add to a node when a node is dragged
 * over it.
 * @param group - The group that the parent belongs to.
 * @param dropZone - A flag to indicate whether the parent is itself a drop
 * zone.
 * @param handleDragend - The function to call when a dragend event is triggered.
 * @param handleDragstart - The function to call when a dragstart event is
 * triggered.
 * @param handleTouchstart - The function to call when a touchstart event is
 * triggered.
 * @param handleDragoverParent - The function to call when a dragover event is
 * triggered on the parent.
 * @param handleDragoverNode - The function to call when a dragover event is
 * triggered on a node.
 * @param handleTouchmove - The function to call when a touchmove event is
 * triggered.
 * @param longTouch - A flag to indicate whether long touch is enabled. Works
 * only for touch events.
 * @param longTouchClass - The class to add to a node when a long touch is
 * detected.
 * @param longTouchTimeout - The time in milliseconds to wait before a long
 * touch is detected.
 * @param name - The name of the parent (used for accepts function for increased
 * specificity).
 * @param plugins - An array of plugins to use for the parent.
 * @param root - The root element to use for the parent.
 * @param setupNode - The function to call when a node is set up.
 * @param sortable - A flag to indicate whether the parent is sortable.
 * @param tearDownNode - The function to call when a node is torn down.
 * @param threshold - The threshold for a drag to be considered a valid sort
 * operation.
 * @param touchDraggingClass - The class to add to a node when it is being
 * dragged via touch.
 * @param touchDropZoneClass - The class to add to a node when a node is dragged
 * over it via touch.
 */
export interface ParentConfig {
  [key: string]: any;
  accepts?: (
    targetParentData: ParentRecord,
    initialParentData: ParentRecord,
    lastParentData: ParentRecord,
    state: DragState | TouchState
  ) => boolean;
  disabled?: boolean;
  dragHandle?: string;
  draggable?: (child: HTMLElement) => boolean;
  draggingClass?: string;
  dropZoneClass?: string;
  group?: string;
  dropZone?: boolean;
  handleDragend: NodeAction;
  handleDragstart: NodeAction;
  handleTouchstart: NodeAction;
  handleDragoverParent: ParentAction;
  handleDragoverNode: (data: NodeDragEventData) => void;
  handleTouchmove: (data: NodeTouchEventData) => void;
  handleTouchOverNode: (data: TouchOverNodeEvent) => void;
  handleTouchOverParent: (e: TouchOverParentEvent) => void;
  longTouch?: boolean;
  longTouchClass?: string;
  longTouchTimeout?: number;
  name?: string;
  performSort: (
    state: DragState | TouchState,
    data: NodeDragEventData | NodeTouchEventData
  ) => void;
  performTransfer: (
    state: DragState | TouchState,
    data: NodeEventData | ParentEventData
  ) => void;
  plugins?: Array<DNDPlugin>;
  root: Document | ShadowRoot;
  setupNode: SetupNode;
  sortable?: boolean;
  tearDownNode: TearDownNode;
  threshold: {
    horizontal: number;
    vertical: number;
  };
  touchDraggingClass?: string;
  touchDropZoneClass?: string;
}

/**
 * The data assigned to a given parent in the `parents` weakmap.
 *
 * @param getValues - A function that returns the values assigned to the parent.
 * @param setValues - A function that sets the values assigned to the parent.
 * @param config - The configuration object for the parent.
 * @param enabledNodes - The nodes that are currently enabled for drag and drop.
 * @param abortControllers - The abort controllers for the parent.
 */
export interface ParentData {
  getValues: (parent: HTMLElement) => Array<any>;
  setValues: (values: Array<any>, parent: HTMLElement) => void;
  config: ParentConfig;
  enabledNodes: Array<NodeRecord>;
  abortControllers: Record<string, AbortController>;
}

/**
 * The data assigned to a given node in the `nodes` weakmap.
 *
 * @param index - The index of the in respect to its adjacent enabled nodes.
 * @param value - The value of the node.
 * @param privateClasses - The private classes of the node (used for
 * preventing erroneous removal of classes).
 * @param abortControllers - The abort controllers for the node.
 */
export interface NodeData {
  index: number;
  value: any;
  privateClasses: Array<string>;
  abortControllers: Record<string, AbortController>;
}

/**
 * The data passed to the node event listener.
 *
 * @param e - The event that was triggered.
 * @param targetData - The data of the target node.
 */
export interface NodeEventData {
  e: Event;
  targetData: NodeTargetData;
}

/**
 * The data passed to the node event listener when the event is a drag event.
 *
 * @param e - The event that was triggered.
 */
export interface NodeDragEventData extends NodeEventData {
  e: DragEvent;
}

/**
 * The data passed to the node event listener when the event is a touch event.
 *
 * @param e - The event that was triggered.
 * @param targetData - The data of the target node.
 */
export interface NodeTouchEventData extends NodeEventData {
  e: TouchEvent;
  targetData: NodeTargetData;
}

/**
 * The data passed to the parent event listener.
 *
 * @param e - The event that was triggered.
 * @param targetData - The data of the target parent.
 */
export interface ParentEventData {
  e: Event;
  targetData: ParentTargetData;
}

/**
 * The target data of the parent involved with the event, whether a node or
 * parent event.
 *
 * @param param - The parent record.
 */
export interface ParentTargetData {
  parent: ParentRecord;
}

/**
 * The target data of the node involved with the event.
 *
 * @param node - The node record.
 * @param parent - The parent record.
 */
export interface NodeTargetData {
  node: NodeRecord;
  parent: ParentRecord;
}

/**
 * The node record, contains the el and the data in the `nodes` weakmap.
 */
export interface NodeRecord {
  el: Node;
  data: NodeData;
}

/**
 * The parent record, contains the el and the data in the `parents` weakmap.
 */
export interface ParentRecord {
  el: HTMLElement;
  data: ParentData;
}

/**
 * Potential payload for the `getElementFromPoint` function.
 *
 * @param node - The node record.
 * @param parent - The parent record.
 */
export interface NodeFromPoint {
  node: NodeRecord;
  parent: ParentRecord;
}

/**
 * Potential payload for the `getElementFromPoint` function.
 *
 * @param parent - The parent record.
 */
export interface ParentFromPoint {
  parent: ParentRecord;
}

/**
 * The event listener for a node event.
 */
export type NodeEvent = (data: NodeEventData) => void;

/**
 * The interface for a node in the context of FormKit's Drag and Drop.
 *
 * @param parentNode - The parent node of the node.
 */
export interface Node extends HTMLElement {
  parentNode: HTMLElement;
}

/**
 * The payload of the custom event dispatched when a node is "touched" over a
 * node.
 */
export interface TouchOverNodeEvent extends Event {
  detail: {
    e: TouchEvent;
    targetData: NodeTargetData;
  };
}

/**
 * The payload of the custom event dispatched when a node is "touched" over a
 * parent.
 */
export interface TouchOverParentEvent extends Event {
  detail: {
    e: TouchEvent;
    targetData: ParentTargetData;
  };
}

/**
 * The WeakMap of nodes.
 */
export type NodesData = WeakMap<Node, NodeData>;

/**
 * The WeakMap of parents.
 */
export type ParentsData = WeakMap<HTMLElement, ParentData>;

/**
 * The WeakMap of parent observers.
 */
export type ParentObservers = WeakMap<HTMLElement, MutationObserver>;

/**
 * The interface for a drag and drop plugin.
 *
 * @param setup - The function to call when the parent is set up.
 * @param tearDown - The function to call when the parent is torn down.
 * @param setupNode - The function to call when a node is set up.
 * @param tearDownNode - The function to call when a node is torn down.
 */
export interface DNDPluginData {
  setup?: () => void;
  tearDown?: () => void;
  setupNode?: SetupNode;
  tearDownNode?: TearDownNode;
}

/**
 * The data passed to the plugin when it is set up.
 */
export interface PluginData {
  parent: HTMLElement;
}

export type DNDPlugin = (parent: HTMLElement) => DNDPluginData | undefined;

export interface DragAndDropData {
  parent: HTMLElement;
  values: Array<any>;
}

export type SetupNode = (data: SetupNodeData) => void;

export type TearDownNode = (data: TearDownNodeData) => void;

/**
 * The payload of when the setupNode function is called in a given plugin.
 *
 * @param node - The node that is being set up.
 * @param nodeData - The data of the node that is being set up.
 * @param parent - The parent of the node that is being set up.
 * @param parentData - The data of the parent of the node that is being set up.
 */
export interface SetupNodeData {
  node: Node;
  nodeData: NodeData;
  parent: HTMLElement;
  parentData: ParentData;
}

/**
 * The payload of when the tearDownNode function is called in a given plugin.
 *
 * @param node - The node that is being torn down.
 * @param nodeData - The data of the node that is being torn down.
 * @param parent - The parent of the node that is being torn down.
 * @param parentData - The data of the parent of the node that is being torn down.
 */
export interface TearDownNodeData {
  node: Node;
  nodeData?: NodeData;
  parent: HTMLElement;
  parentData: ParentData;
}

export type EventHandlers = Record<string, (e: Event) => void>;

/**
 * The state of the current drag. TouchState is only created when a touch start
 * event has occurred.
 *
 * @param touchMoving - A flag to indicate whether the dragged (touched) node
 * is moving.
 * @param touchStartLeft - The left position of the touch start.
 * @param touchStartTop - The top position of the touch start.
 * @param touchedNode - The node that was most recently touched.
 * @param longTouchTimeout - The timeout for a long touch.
 * @param scrollParent - The parent that is scrollable.
 * @param scrollParentOverflow - The overflow of the scroll parent.
 * @param longTouch - A flag to indicate whether a long touch has occurred.
 */
export interface TouchState extends DragState {
  touchMoving: boolean;
  touchStartLeft: number;
  touchStartTop: number;
  touchedNode: HTMLElement;
  longTouchTimeout: ReturnType<typeof setTimeout> | undefined;
  scrollParent: HTMLElement | undefined;
  scrollParentOverflow: string | undefined;
  longTouch: boolean;
  touchedNodeDisplay: string | undefined;
}

/**
 * The state of the current drag. State is only created when a drag start
 * event is triggered.
 *
 * @param activeNode - The node that was most recently clicked (used optionally).
 * @param affectedNodes - The nodes that will be updated by a drag action
 * (sorted).
 * @param ascendingDirection - Indicates whetehr the dragged node is moving to a
 * node with a higher index or not.
 * @param clonedDraggedEls - The cloned elements of the dragged node. This is
 * used primarily for TouchEvents or multi-drag purposes.
 * @param draggedNode - The node that is being dragged.
 * @param draggedNodes - The nodes that are being dragged.
 * @param incomingDirection - The direction that the dragged node is moving into
 * a dragover node.
 * @param initialParent - The parent that the dragged node was initially in.
 * @param lastParent - The parent that the dragged node was most recently in.
 * @param lastValue - The last value of the dragged node.
 * @param originalZIndex - The original z-index of the dragged node.
 * @param preventEnter - A flag to prevent a sort operation from firing until
 * the mutation observer has had a chance to update the data of the remapped
 * nodes.
 * @param swappedNodeValue - The value of the node that was swapped with the
 * dragged node.
 * @param targetIndex - The index of the node that the dragged node is moving
 * into.
 */
export interface DragState extends DragStateProps {
  activeNode: NodeRecord | undefined;
  affectedNodes: Array<NodeRecord>;
  ascendingDirection: boolean;
  clonedDraggedEls: Array<Element>;
  draggedNode: NodeRecord;
  draggedNodes: Array<NodeRecord>;
  incomingDirection: "above" | "below" | "left" | "right" | undefined;
  initialParent: ParentRecord;
  lastParent: ParentRecord;
  lastValue: any;
  originalZIndex: string | undefined;
  preventEnter: boolean;
  swappedNodeValue: any | undefined;
  targetIndex: number;
}

export interface DragStateProps {
  draggedNode: NodeRecord;
  draggedNodes: Array<NodeRecord>;
  initialParent: ParentRecord;
  lastParent: ParentRecord;
}

export interface TouchStateProps {
  touchedNode: HTMLElement;
  touchStartLeft: number;
  touchStartTop: number;
}
