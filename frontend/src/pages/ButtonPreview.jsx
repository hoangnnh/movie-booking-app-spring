import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Button from "../components/common/Button";

export default function ButtonPreview() {
    return (
        <div className="min-h-screen bg-app-background p-[48px] text-app-text">
            <div className="flex flex-col gap-[32px]">
                <div className="flex items-center gap-[24px]">
                    <Button
                        size={40}
                        variant="primary"
                        leftIcon={<ChevronLeft />}
                        rightIcon={<ChevronRight />}
                    >
                        Button
                    </Button>

                    <Button
                        size={40}
                        variant="outline"
                        leftIcon={<ChevronLeft />}
                        rightIcon={<ChevronRight />}
                    >
                        Button
                    </Button>

                    <Button
                        size={40}
                        variant="text"
                        leftIcon={<ChevronLeft />}
                        rightIcon={<ChevronRight />}
                    >
                        Button
                    </Button>

                    <Button size={40} variant="text" iconOnly rightIcon={<Search />}>
                        Search
                    </Button>
                </div>

                <div className="flex items-center gap-[24px]">
                    <Button size={48} variant="primary" tone="base">
                        Button
                    </Button>

                    <Button size={48} variant="outline" tone="base">
                        Button
                    </Button>

                    <Button size={48} variant="text" tone="base">
                        Button
                    </Button>

                    <Button size={48} variant="text" tone="base" iconOnly rightIcon={<Search />}>
                        Search
                    </Button>
                </div>

                <div className="flex items-center gap-[24px]">
                    <Button size={56} variant="primary" disabled>
                        Button
                    </Button>

                    <Button size={56} variant="outline" disabled>
                        Button
                    </Button>

                    <Button size={56} variant="text" disabled>
                        Button
                    </Button>

                    <Button size={56} variant="text" iconOnly disabled rightIcon={<Search />}>
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
}