import generateAuthHeader from './generateCode/auth';

class BodyParser {
  constructor(body) {
    this.body = body;
    this.mime = body.mimeType;
  }

  __parseJSON() {
    if (!this.body.text) {
      return;
    }

    const text = JSON.stringify(JSON.parse(this.body.text), null, 2);

    return {
      type: 'plain',
      note: 'json',
      text: `<pre>${text}</pre>`
    };
  }

  __parseMultipart() {
    const rows = this.body.params.map(p => {
      return {
        name: p.name,
        value: p.value,
        description: p.description
      };
    });

    return {
      type: 'array',
      note: 'formdata',
      rows
    };
  }

  __parsePlain() {
    return {
      type: 'plain',
      note: 'raw',
      text: `<pre>${this.body.text}</pre>`
    };
  }

  parse() {
    switch (this.mime) {
      case 'application/json':
        return this.__parseJSON();
      case 'multipart/form-data':
      case 'application/x-www-form-urlencoded':
        return this.__parseMultipart();
      default:
        return this.__parsePlain();
    }
  }
};

class ContentGenerator {
  constructor(req) {
    this.req = req;
  }

  params() {
    const rows = [];

    this.req.parameters.forEach(param => {
      rows.push({
        name: param.name,
        value: param.value,
        description: param.description
      });
    });

    return {
      title: 'URL参数',
      rows
    };
  }

  headers() {
    const rows = [];

    this.req.headers.forEach(header => {
      rows.push({
        name: header.name,
        value: header.value,
        description: header.description
      });
    });

    if (this.req.authentication && this.req.authentication.type) {
      const authHeader = generateAuthHeader(this.req.authentication);

      rows.push({
        name: authHeader.name,
        value: `<pre>${authHeader.value}</pre>`
      });
    }

    return {
      title: 'Headers',
      rows
    };
  }

  body() {
    const parser = new BodyParser(this.req.body);
    const data = parser.parse();

    switch (data.type) {
      case 'array':
        return {
          title: '请求数据',
          note: data.note,
          rows: data.rows
        };
      case 'plain':
        return {
          title: '请求数据',
          note: data.note,
          text: data.text
        };
    }
  }
};

export default ContentGenerator;
