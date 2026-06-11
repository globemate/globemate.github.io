import { getStripePayments } from "@invertase/firestore-stripe-payments";
import app from "./firebase";

const payments = getStripePayments(app, {
  productsCollection: "products",
  customersCollection: "customers",
});

export default payments;
