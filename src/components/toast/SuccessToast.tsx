import Toast from "./Toast";

export default function SuccessToast(props: { message: string; duration?: number }) {
  return <Toast type="success" {...props} />;
}
