<MultiSelectPopup />

# Features

## Specialized Inputs for Creative Software

![](/assets/components_list.webp)

Tweeq offers a suite of specialized input components tailored for professional creative applications. Beyond standard color pickers and numeric sliders, it includes rotary knobs, two-dimensional offset controls, and even timecode-specific interfaces. These components are designed to meet the nuanced needs of graphic design, digital audio workstations (DAWs), and video editing tools, providing precise and efficient parameter manipulation.

## “Drag-to-tweak” Interaction

Several input components within Tweeq support the “drag-to-tweak” interaction paradigm, allowing users to adjust values by dragging over pads, handles, and similar elements.

During a drag operation, you can modify the parameter being adjusted, change the adjustment scale, or constrain the adjustment to a specific axis by pressing designated keys.

While specific key functions may vary across components, the general semantics are as follows:

- `Shift`: Increases the adjustment scale, enabling quicker value changes.
- `Alt` (`Option` on Mac): Decreases the adjustment scale, allowing for finer, more precise adjustments.
- `Q`: Activates value snapping, aligning adjustments to predefined increments for consistency.
- `A` / `R`: Activates absolute/relative mode.

Consistently, dragging to the right or upward increases parameter values. However, for parameters with geometric counterparts in the viewport, such as position or rotation, the drag direction aligns with the corresponding geometric interpretation (e.g., dragging downward increases the Y-axis value in [InputPosition](components#inputposition)).

## Simultaneous Editing

Many components in Tweeq support simultaneous selection and editing, akin to the behavior of spreadsheet cells. By holding down the `Shift` or Meta key (`Ctrl` on Windows, `Command` on Mac), users can select multiple components and adjust them concurrently, streamlining workflows that require coordinated parameter changes across multiple elements.

## Expression Support

Tweeq supports dynamic parameter control through JavaScript expressions. Users can input any valid JavaScript expression to define parameter values.

Expressions can reference several predefined variables:

- `x`: Current value of the parameter
- `i`: Zero-based index of the current parameter.
