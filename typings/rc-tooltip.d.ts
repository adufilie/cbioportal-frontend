// Type definitions for rc-tooltip v3.4.2
// Project: https://github.com/react-component/tooltip
// Definitions by: rhysd <https://rhysd.github.io>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

/// <reference types="react" />

declare module "rc-tooltip"
{
	namespace Tooltip
	{
		export type Trigger = "hover" | "click" | "focus";
		export type Placement =
			"left" | "right" | "top" | "bottom" |
			"topLeft" | "leftTop" | "topRight" | "rightTop" |
			"bottomRight" | "rightBottom" | "bottomLeft" | "leftBottom";
		export type Point = "cr" | "cl" | "bc" | "tc" | "bl" | "tl" | "tr" | "br";
		export type Overflow = {adjustX: number, adjustY: number};
		export type Offset = [number, number];
		export type Align = {
			points: Point[],
			overflow: Overflow,
			offset: Offset,
			targetOffset: Offset,
		};

		export interface Props {
			overlayClassName?: string;
			trigger?: Trigger[];
			mouseEnterDelay?: number;
			mouseLeaveDelay?: number;
			overlayStyle?: React.CSSProperties;
			prefixCls?: string;
			transitionName?: string;
			onVisibleChange?: () => void;
			visible?: boolean;
			defaultVisible?: boolean;
			placement?: Placement;
			align?: Align;
			onPopupAlign?: (popupDomNode: Element, align: Align) => void;
			overlay: React.ReactElement<any> | (() => React.ReactElement<any>);
			arrowContent?: React.ReactNode;
			getTooltipContainer?: () => Element;
			destroyTooltipOnHide?: boolean;
		}
	}

	class Tooltip extends React.Component<Tooltip.Props, {}> {}

	export default Tooltip;
}
