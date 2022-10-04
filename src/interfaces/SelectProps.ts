export interface SelectElement {
    value: number;
    label: string;
}

export interface CustomSelectProps {
    items: SelectElement[];
    onChange(props: any): void;
}