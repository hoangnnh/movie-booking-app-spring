import Navbar from "../components/layout/Navbar";
import Avatar from "../components/common/Avatar";
import SearchInput from "../components/common/SearchInput";
import Button from "../components/common/Button";
import { Search } from "lucide-react";

const demoUser = {
  fullName: "Luna Caldwell",
};

export default function NavbarPreview() {
  return (
    <div className="min-h-screen bg-app-background p-[32px] text-app-text">
      <div className="flex flex-col gap-[32px]">
        <Navbar
          variant="solid"
          onLoginClick={() => alert("Login")}
          onSignUpClick={() => alert("Sign up")}
        />

        <Navbar
          variant="bordered"
          onLoginClick={() => alert("Login")}
          onSignUpClick={() => alert("Sign up")}
        />

        <Navbar
          variant="solid"
          user={demoUser}
          avatarSrc="https://i.pravatar.cc/100?img=5"
        />

        <Navbar
          variant="bordered"
          user={demoUser}
          avatarSrc="https://i.pravatar.cc/100?img=5"
        />

        <div className="flex items-center gap-[24px]">
          <Avatar size={40} src="https://i.pravatar.cc/100?img=5" />
          <Avatar size={48} src="https://i.pravatar.cc/100?img=5" />
          <Avatar size={56} src="https://i.pravatar.cc/100?img=5" />
          <Avatar size={80} src="https://i.pravatar.cc/100?img=5" />
          <Avatar size={100} src="https://i.pravatar.cc/100?img=5" />
        </div>

        <div className="flex w-[420px] flex-col gap-[12px]">
          <Button variant="text" size={40} iconOnly rightIcon={<Search />} />
          <SearchInput placeholder="Search here" />
        </div>
      </div>
    </div>
  );
}