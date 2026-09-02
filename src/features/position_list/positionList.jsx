import "./positionList.css"


function PositionList ({trades}) {
console.log(trades);
   

    return(
        <section className="lists-page">
            <div className="lists-container">
                <div className="list-opened">opened</div>
                <div className="list-closed">

                    <div className="position"></div>

                </div>
            </div>
        </section>
    )
}
export default PositionList;