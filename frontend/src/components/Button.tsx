export const Button = ({ 
    onClick, 
    children, 
    className = "", 
    disabled = false 
}: { 
    onClick: () => void, 
    children: React.ReactNode,
    className?: string,
    disabled?: boolean
}) => {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`px-8 py-4 text-2xl bg-green-500 hover:bg-green-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );
}