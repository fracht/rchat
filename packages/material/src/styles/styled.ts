import { PropsOf } from '@emotion/react';
import { type Theme } from '@mui/material';
import { FilteringStyledOptions, CreateStyledComponent, StyledOptions } from '@mui/styled-engine';
import createStyled, { MUIStyledCommonProps, MuiStyledOptions } from '@mui/system/createStyled';
import { defaultTheme } from './defaultTheme';

interface CreateMUIStyled {
	<
		TOwnerState extends object,
		C extends React.ComponentClass<React.ComponentProps<C>>,
		ForwardedProperties extends keyof React.ComponentProps<C> = keyof React.ComponentProps<C>,
	>(
		component: C,
		options: FilteringStyledOptions<React.ComponentProps<C>, ForwardedProperties> & MuiStyledOptions,
	): CreateStyledComponent<
		Pick<PropsOf<C>, ForwardedProperties> &
			MUIStyledCommonProps<Theme> &
			({} extends Required<TOwnerState> ? {} : { ownerState: TOwnerState }),
		{},
		{
			ref?: React.Ref<InstanceType<C>>;
		},
		Theme
	>;

	<TOwnerState extends object, C extends React.ComponentClass<React.ComponentProps<C>>>(
		component: C,
		options?: StyledOptions<PropsOf<C> & MUIStyledCommonProps<Theme>> & MuiStyledOptions,
	): CreateStyledComponent<
		PropsOf<C> &
			MUIStyledCommonProps<Theme> &
			({} extends Required<TOwnerState> ? {} : { ownerState: TOwnerState }),
		{},
		{
			ref?: React.Ref<InstanceType<C>>;
		},
		Theme
	>;

	<
		TOwnerState extends object,
		C extends React.JSXElementConstructor<React.ComponentProps<C>>,
		ForwardedProperties extends keyof React.ComponentProps<C> = keyof React.ComponentProps<C>,
	>(
		component: C,
		options: FilteringStyledOptions<React.ComponentProps<C>, ForwardedProperties> & MuiStyledOptions,
	): CreateStyledComponent<
		Pick<PropsOf<C>, ForwardedProperties> &
			MUIStyledCommonProps<Theme> &
			({} extends Required<TOwnerState> ? {} : { ownerState: TOwnerState }),
		{},
		{},
		Theme
	>;

	<TOwnerState extends object, C extends React.JSXElementConstructor<React.ComponentProps<C>>>(
		component: C,
		options?: StyledOptions<PropsOf<C> & MUIStyledCommonProps<Theme>> & MuiStyledOptions,
	): CreateStyledComponent<
		PropsOf<C> &
			MUIStyledCommonProps<Theme> &
			({} extends Required<TOwnerState> ? {} : { ownerState: TOwnerState }),
		{},
		{},
		Theme
	>;

	<
		TOwnerState extends object,
		Tag extends keyof JSX.IntrinsicElements,
		ForwardedProperties extends keyof JSX.IntrinsicElements[Tag] = keyof JSX.IntrinsicElements[Tag],
	>(
		tag: Tag,
		options: FilteringStyledOptions<JSX.IntrinsicElements[Tag], ForwardedProperties> & MuiStyledOptions,
	): CreateStyledComponent<
		MUIStyledCommonProps<Theme> & ({} extends Required<TOwnerState> ? {} : { ownerState: TOwnerState }),
		Pick<JSX.IntrinsicElements[Tag], ForwardedProperties>,
		{},
		Theme
	>;

	<TOwnerState extends object, Tag extends keyof JSX.IntrinsicElements>(
		tag: Tag,
		options?: StyledOptions<MUIStyledCommonProps<Theme>> & MuiStyledOptions,
	): CreateStyledComponent<
		MUIStyledCommonProps<Theme> & ({} extends Required<TOwnerState> ? {} : { ownerState: TOwnerState }),
		JSX.IntrinsicElements[Tag],
		{},
		Theme
	>;
}

export const styled = createStyled({
	defaultTheme,
}) as CreateMUIStyled;
