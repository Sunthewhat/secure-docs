import Toast from "./Toast";

export default function ErrorToast(props: { message: string; duration?: number }) {
  return <Toast type="error" {...props} />;
}
