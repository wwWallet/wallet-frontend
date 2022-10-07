export interface SelectElement {
    value: number | string;
    label: string;
}

export interface CustomSelectProps {
    items: SelectElement[];
		isMulti?: boolean;
    onChange(props: any): void;
}