import { OverridableComponent, OverrideProps } from '@mui/material/OverridableComponent';
import { SxProps, Theme } from '@mui/system';
import { ElementType, FunctionComponent } from 'react';

type GenericTypeMap<TProperties, TDefaultComponent extends ElementType, TAdditionalProperties = {}> = {
	props: TAdditionalProperties &
		TProperties & {
			sx?: SxProps<Theme>;
		};
	defaultComponent: TDefaultComponent;
};

export const createMuiComponent = <TProperties, TDefaultElement extends ElementType>(
	component: FunctionComponent<TProperties & { component: ElementType }>,
) => {
	return component as unknown as OverridableComponent<GenericTypeMap<TProperties, TDefaultElement>>;
};

// eslint-disable-next-line unicorn/prevent-abbreviations
export type MuiComponentProps<
	TProperties,
	TDefaultComponent extends ElementType,
	TAdditionalProperties,
> = OverrideProps<GenericTypeMap<TProperties, TDefaultComponent, TAdditionalProperties>, TDefaultComponent>;
