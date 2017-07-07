'use strict';

$(document).ready(() => {
    $('select').material_select();
    $('.button-collapse').sideNav();
    $('#menu').on('click', () => {
        $('.tap-target').tapTarget('open');
    });

    $('#submitButton').on('click', () => {
        let data = {};
        $.each($('#requestForm').serializeArray(), (i, q) => {
            data[q.name] = q.value;
        });
        data.tags = data.tags.split(',');

        const publicKey = `-----BEGIN PUBLIC KEY-----
            MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7Aw1Zin9eJUsrSyV0jSn
            XwmevusOEPyW9C4BN1FtQ2VKfb98e+2lcrXP7W0+Mk7Ck93PAc0tPinsj79YBgLK
            W/J31zDsPcpAEXbrH8R6rfHRGZWH/12aMPGl9/329GEpWzl/RLe2REqnNNn6PYxK
            1Zms3If3meQ60g9JcOmGb9+lUOqa4bFtX8AUvU4oLp/sqRIp7ABAw/pqAbWV6TON
            j1rFZlic1lh8ClUG1cbsP9ysx2TIjZo6DQ6BIzPUbPlwLVxG+wQJmhWzGHcEEteV
            r8PIxBUw5QsySN5FbyTaiTlp0Usi+3wJOpgb+xrw9EQWcOXZiaZshxKaMT33ssys
            qQIDAQAB
            -----END PUBLIC KEY-----`;
        const crypto = new JSEncrypt();
        crypto.setPublicKey(publicKey);
        const encrypted = crypto.encrypt(JSON.stringify(data));

        function renderMainContent(success) {
            const color = success ? 'green' : 'red';
            const message = success ? 'The hacker has recieved your request. You\'ll have to wait for the response to get in contact.' : 'Some unknown error occured...';
            return `
                <div class="container">
                    <div class="row">
                        <div class=" col s12">
                            <div class="card-panel hoverable ${color} darken-4">
                                <span class="white-text">
                                    ${message}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="fixed-action-btn" style="bottom: 45px; right: 24px;">
                    <a id="menu" class="btn btn-floating btn-large grey darken-2">
                        <i class="material-icons">info_outline</i>
                    </a>
                </div>
                <div class="tap-target grey" data-activates="menu">
                    <div class="tap-target-content">
                        <h5>Concerned about security?</h5>
                        <p>We are too! Read more about this topic on our information page.</p>
                        <a class="btn black waves-effect waves-light" href="/about">click here</a>
                    </div>
                </div>
            `;
        }

        $.post(location.pathname, {
            data: encrypted
        })
            .done((response) => {
                $('main').html(renderMainContent(true));
                $('#menu').on('click', () => {
                    $('.tap-target').tapTarget('open');
                });
            })
            .fail((error) => {
                $('main').html(renderMainContent(false));
                $('#menu').on('click', () => {
                    $('.tap-target').tapTarget('open');
                });
            });
    });
});

function changeSelectValue(e) {
    let name = '';
    let notification = '';
    let label = '';
    switch (e.value) {
        case '1': {
            name = 'phoneNumber';
            notification = '<strong>Note:</strong>&nbsp;&nbsp;Your hacker will call you...maybe sometime in the deep future.';
            label = 'Give your phone number.';
            break;
        }
        case '2': {
            name = 'email';
            notification = '<strong>Note:</strong>&nbsp;&nbsp;Your hacker has promised to not spam your mailbox.';
            label = 'Give your email-address.';
            break;
        }
        case '3': {
            name = 'address';
            notification = '<strong>Note:</strong>&nbsp;&nbsp;Your hacker will visit you to discuss further details.';
            label = 'Give your address.';
            break;
        }
        case '4': {
            name = 'secretPlace';
            notification = '<strong>Note:</strong>&nbsp;&nbsp;You will meet yout hacker there tomorrow midnight. Bring a flashlight and your black coat!';
            label = 'Give a secret location.';
            break;
        }
    }
    if (name !== '' && notification !== '' && label !== '') {
        $('#contactQuestion').html(`
            <div class="row">
                <div class="input-field col s12 m6 offset-m3">
                    <label for="contactQuestionInput">${label}</label>
                    <input id="contactQuestionInput" type="text" name="${name}" />
                    <div class="card grey darken-2">
                        <div class="card-content white-text">
                            <p>${notification}</p>
                        </div>
                    </div>
                </div>
            </div>
        `);
    } else {
        $('#contactQuestion').html('');
    }
}
