import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Landing: undefined;
  PhoneLogin: undefined;
  EmailLogin: undefined;
  OtpVerify: { phone: string };
  RoleSelect: undefined;
  CustomerRegister: undefined;
  TailorRegister: undefined;
  DeliveryRegister: undefined;
};

export type CustomerStackParamList = {
  Home: undefined;
  Categories: undefined;
  FabricScan: undefined;
  Designs: { categorySlug: string; categoryName: string };
  CreateOrder: { designId?: string; categorySlug?: string };
  Orders: undefined;
  OrderTrack: { orderId: string };
  DeliveryMap: { orderId: string };
  Profile: undefined;
  ThemePicker: undefined;
  // ── AI Design Studio ──────────────────────────────────────────────────────
  AIFabricUpload: undefined;
  AICategorySelect: undefined;
  AIProcessing: undefined;
  AIResultsGallery: { jobId: string };
  AISavedDesigns: undefined;
};

export type TailorStackParamList = {
  Dashboard: undefined;
  Register: undefined;
  AvailableOrders: undefined;
  MyOrders: undefined;
  OrderDetail: { orderId: string };
  Reports: undefined;
  Profile: undefined;
  ThemePicker: undefined;
};

export type DeliveryStackParamList = {
  Dashboard: undefined;
  Register: undefined;
  ActivePickup: { assignmentId: string };
  DeliveryMap: { assignmentId: string };
  Reports: undefined;
  Profile: undefined;
  ThemePicker: undefined;
};

export type AdminStackParamList = {
  Dashboard: undefined;
  Approvals: undefined;
  OrdersOverview: undefined;
  Reports: undefined;
  ManageAdmins: undefined;
};

export type AuthScreenProps<K extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, K>;
export type CustomerScreenProps<K extends keyof CustomerStackParamList> = NativeStackScreenProps<CustomerStackParamList, K>;
export type TailorScreenProps<K extends keyof TailorStackParamList> = NativeStackScreenProps<TailorStackParamList, K>;
export type DeliveryScreenProps<K extends keyof DeliveryStackParamList> = NativeStackScreenProps<DeliveryStackParamList, K>;
export type AdminScreenProps<K extends keyof AdminStackParamList> = NativeStackScreenProps<AdminStackParamList, K>;
