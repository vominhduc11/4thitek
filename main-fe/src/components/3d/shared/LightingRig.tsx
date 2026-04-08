interface LightingRigProps {
    accentColor?: string;
    fillColor?: string;
    ambientIntensity?: number;
}

export default function LightingRig({
    accentColor = '#29abe2',
    fillColor = '#8fdbff',
    ambientIntensity = 0.6
}: LightingRigProps) {
    return (
        <>
            <ambientLight intensity={ambientIntensity} />
            <directionalLight position={[4.5, 4.5, 6]} intensity={2.1} color={fillColor} />
            <pointLight position={[-5, -2, 4]} intensity={1.2} color={accentColor} />
            <pointLight position={[0, 3.5, -2]} intensity={0.8} color="#4fc8ff" />
        </>
    );
}
