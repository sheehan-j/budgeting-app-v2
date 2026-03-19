export type CategoryCreateInput = {
	name: string;
	color: string;
	userId: string;
};

export type RawCategory = {
	id: number;
	name: string;
	color: string;
};

export type Category = {
	id: number;
	name: string;
	color: string;
	position: number;
	colorDark: string;
	colorLight: string;
};