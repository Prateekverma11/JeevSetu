import { useEffect } from 'react';

const ImageModal = ({ isOpen, onClose, src, alt }) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !src) return null;

    return (
        <div 
            className="pure-image-modal-backdrop" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            {/* Floating Close Button for Mobile & Desktop */}
            <button 
                type="button" 
                className="pure-image-modal-close"
                onClick={onClose}
                aria-label="Close image"
                title="Close (Esc)"
            >
                ✕
            </button>

            {/* Pure Full-Size Image Only */}
            <div 
                className="pure-image-modal-wrap"
                onClick={(e) => e.stopPropagation()}
            >
                <img 
                    src={src} 
                    alt={alt || 'Full size view'} 
                    className="pure-image-modal-img" 
                />
            </div>
        </div>
    );
};

export default ImageModal;
