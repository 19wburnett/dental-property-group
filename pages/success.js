import { useRouter } from 'next/router';

export default function Success() {
    const router = useRouter();

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1>Thank You!</h1>
            <p>DPG is interested in your deal. Please submit further information.</p>
            <button onClick={() => router.push('/sell-your-office')} className="btn-primary">
                Go to Sell Your Office Form
            </button>
        </div>
    );
}
