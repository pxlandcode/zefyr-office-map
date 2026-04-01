import { type AirDatepickerOptions } from 'air-datepicker';

type Props = {
    options?: AirDatepickerOptions;
    value?: string;
    class?: string;
};

declare const Datepicker: import("svelte").Component<Props, {}, "value">;
type Datepicker = ReturnType<typeof Datepicker>;
export default Datepicker;
