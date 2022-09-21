import { useState, useEffect } from 'react';
import './Test.css';





export const TabTest: React.FC = () => {
    return (
        <>
            <section className="tab-row-layout">
                <div>
                    <section className='tab-layout'>
                        <div>Verifiable Credentials</div>
                        <div>Presentations Audit Log</div>
                        <div>Settings</div>
                        <div>Logout</div>
                    </section>
                </div>
            </section>
            <section className="tab-row-layout secondary">
                <section className='tab-layout secondary'>
                        <div className='secondary-tab-elem'>
                            <i className="fa fa-calendar-times-o" style={{fontSize: '35px', textAlign: 'center'}} aria-hidden="true"></i>
                            <span style={{textAlign: 'center', display: 'block', letterSpacing: '1px'}}>
                                All
                            </span>
                        </div>
                        <div className='secondary-tab-elem'>
                            <i className="fa fa-calendar-times-o" style={{fontSize: '35px', textAlign: 'center'}} aria-hidden="true"></i>
                            <span style={{textAlign: 'center', display: 'block', letterSpacing: '1px'}}>
                                Expired
                            </span>
                        </div>

                    </section>
            </section>
            <div className="gunet-container">

            </div>
        </>
    );
}

export default TabTest;