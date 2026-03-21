export type CategoryInput = {
	id?: number;
	name: string;
	color: string;
};

export type RawCategory = {
	id: number;
	name: string;
	color: string;
};

export type Category = {
	id: number;
	name: string;
	colorName: string;
	color: string;
	position: number;
	colorDark: string;
	colorLight: string;
};
