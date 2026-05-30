const Spinner = ({ size = 'md' }) => {
    const sizes = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className="flex justify-center items-center">
            <div
                className={`${sizes[size]} border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin`}
            />
        </div>
    );
};

export default Spinner;