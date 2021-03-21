// https://stackoverflow.com/a/11339012
// Note: Form should not have repeated names
function parseForm($form) {
    const unindexed_array = $form.serializeArray();
    const indexed_array = {};

    $.map(
        unindexed_array,
        function(form_element, index){
            const name = form_element["name"];
            const value = form_element["value"];
            if (value !== "") {
                indexed_array[name] = currency(value);
            }
            else {
                indexed_array[name] = currency(0);
            }
        }
    );

    return indexed_array;
}

function calculateResults(parsed_form) {
    const calculated_results = {};

    calculated_results.gross_pay = parsed_form.gross_pay.multiply(parsed_form.pay_frequency);

    calculated_results.additional_compensation = parsed_form.additional_pay;

    calculated_results.employer_match = calculated_results.gross_pay.add(parsed_form.additional_pay).multiply(parsed_form.additional_match).divide(100);

    const days_work_per_year = parsed_form.days_work_per_week.multiply(52);
    const daily_rate = calculated_results.gross_pay.divide(days_work_per_year);
    calculated_results.time_off = daily_rate.multiply(parsed_form.days_off);

    const days_work_on_site_per_year = days_work_per_year - parsed_form.remote_days.multiply(52);
    calculated_results.mileage = parsed_form.mileage_rate.multiply(2).multiply(parsed_form.distance_to_work).multiply(days_work_on_site_per_year);

    const time_driving_per_year = parsed_form.time_to_work.multiply(2).divide(60).multiply(days_work_on_site_per_year);
    const hourly_rate = daily_rate.divide(parsed_form.hours_work_per_day);
    calculated_results.time_driving = time_driving_per_year.multiply(hourly_rate); 

    calculated_results.total_compensation = calculated_results.gross_pay.add(calculated_results.additional_compensation).add(calculated_results.employer_match).add(calculated_results.time_off).subtract(calculated_results.mileage).subtract(calculated_results.time_driving);

    return calculated_results;
}

function displayResults(calculated_results) {
    $("#annual-salary").text(calculated_results.gross_pay.format());
    $("#annual-additional").text(calculated_results.additional_compensation.format());
    $("#annual-match").text(calculated_results.employer_match.format());
    $("#annual-time-off").text(calculated_results.time_off.format());
    $("#annual-mileage-distance").text(calculated_results.mileage.format());
    $("#annual-mileage-time").text(calculated_results.time_driving.format());
    $("#total-compensation").text(calculated_results.total_compensation.format());
}

function onChange() {
    const $form = $("form");
    const parsed_form = parseForm($form);
    const calculated_results = calculateResults(parsed_form);
    displayResults(calculated_results);
}

$("input").change(onChange);
$("select").change(onChange);
$(document).ready(onChange);
