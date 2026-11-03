/**
 * Concentric with the content: inner control radius (4) + popup padding (9),
 * matching --tq-radius-popup.
 */
export const BALLOON_RADIUS = 13

/** Width of the arrow's base. */
export const BALLOON_ARROW_WIDTH = 14

/**
 * How close to a corner the arrow's centre can get: it stays on the straight
 * run of the edge, clear of the rounded corner. A popover pointing at something
 * nearer its corner than this has to slide for the arrow to reach it.
 */
export const BALLOON_ARROW_INSET = BALLOON_RADIUS + BALLOON_ARROW_WIDTH / 2
