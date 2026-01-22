import RoleLandingPage from "@/components/role-landing";
import { roleLandingContent } from "@/content/role-landing";

export default function ForHosts() {
  return <RoleLandingPage content={roleLandingContent.hosts} />;
}
