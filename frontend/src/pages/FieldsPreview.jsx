import { useState } from "react";
import InformationalText from "../components/common/InformationalText";
import VerificationCodeInput from "../components/common/VerificationCodeInput";
import EmailField from "../components/common/EmailField";

export default function FieldsPreview() {
    const [code, setCode] = useState("2");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("123456");

    return (
        <div className="min-h-screen bg-app-background p-[48px] text-app-text">
            <div className="flex max-w-[520px] flex-col gap-[40px]">
                <section className="flex flex-col gap-[12px]">
                    <h2 className="type-h5">Informational Text</h2>

                    <InformationalText>Information Text</InformationalText>
                    <InformationalText tone="error">Information Text</InformationalText>
                    <InformationalText
                        rightText="Forgot your password?"
                        onRightClick={() => alert("Forgot password")}
                    >
                        Information Text
                    </InformationalText>
                </section>

                <section className="flex flex-col gap-[12px]">
                    <h2 className="type-h5">Verification Code</h2>

                    <VerificationCodeInput value={code} onChange={setCode} length={4} />
                    <VerificationCodeInput value="22" onChange={() => { }} length={4} error />
                    <VerificationCodeInput value="2" onChange={() => { }} length={4} disabled />
                </section>

                <section className="flex flex-col gap-[16px]">
                    <h2 className="type-h5">Email Fields</h2>

                    <EmailField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                    />

                    <EmailField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        forgotText="Forgot your password?"
                        onForgotClick={() => alert("Forgot password")}
                    />

                    <EmailField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        errorText="Email is required"
                    />

                    <EmailField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled
                    />
                </section>
            </div>
        </div>
    );
}