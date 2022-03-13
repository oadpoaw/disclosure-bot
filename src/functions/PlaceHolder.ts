export default function PlaceHolder(
	message: string,
	placeholder: string,
	replaceWith: string,
) {
	return message.replaceAll(`%{${placeholder}%`, replaceWith);
}
