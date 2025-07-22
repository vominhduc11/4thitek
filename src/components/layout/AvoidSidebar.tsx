function AvoidSidebar({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex">
            <div className="w-16 sm:w-20"></div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

export default AvoidSidebar;
