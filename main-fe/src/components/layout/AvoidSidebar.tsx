function AvoidSidebar({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex">
            <div className="hidden w-20 lg:block"></div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

export default AvoidSidebar;
