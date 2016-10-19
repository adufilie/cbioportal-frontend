/**
 * Created by jiaojiao on 10/14/16.
 */

export default function getDatasetsInfo() {



    // Creating a promise
    var promise = new Promise( function (resolve, reject) {

        var jqxhr = $.get( "http://dashi-dev.cbio.mskcc.org:8080/datasetsAPI/api-legacy/datasets", function(response) {
                resolve(response);
            })
            .fail(function() {
                reject(this.statusText);
            });
    });

    //return Promise.resolve(mockData.studies);
    return promise;
}