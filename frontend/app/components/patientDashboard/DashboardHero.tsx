import type { PropsWithChildren } from "react";

export default function DashboardHero(
    props: PropsWithChildren<{ title: string; bgSrc: string }>
) {
    return (
        <section
            className="dashboard-hero"
            style={{
                backgroundImage: `url(${props.bgSrc})`,
            }}
        >
            <div className="dashboard-overlay">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-8 text-center">
                            <div className="booking-card p-5 rounded">
                                <h2 className="text-white mb-4">
                                    {props.title}
                                </h2>
                                {props.children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
