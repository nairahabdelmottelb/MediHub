import "bootstrap/dist/css/bootstrap.css";
import "../routes/home/home";

export default function Containers() {
    return (
        <>
            <div className="container-sm"></div>
            <div className="container-md"></div>
            <div className="container-lg"></div>
            <div className="container-xl"></div>
            <div className="container-xxl">
                100% wide until extra extra large breakpoint
            </div>
        </>
    );
}
