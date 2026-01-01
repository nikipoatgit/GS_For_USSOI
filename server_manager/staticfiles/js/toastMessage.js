// --------------------------------------------------------------------------------------------------------------------------
//Toast message 
function showToast(message, duration = 2000) {
    console.log(message);
    const toast = document.createElement('div');
    toast.classList.add(
        'fixed',
        'bottom-5',
        'left-1/2',
        '-translate-x-1/2',
        'bg-grey-500',
        'text-white',
        'px-6',
        'py-3',
        'rounded-lg',
        'shadow-xl',
        'opacity-0',
        'translate-y-4',
        'transition-all',
        'duration-300',
        'ease-in-out'
    );

    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}
